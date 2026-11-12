# frozen_string_literal: true

require 'date'
require 'json'

RSpec.describe 'OpenRouter dashboard presets' do
  let(:base) { 'https://openrouter.ai/api/v1' }
  let(:trigger) { { "#{base}/models/count" => { json: { data: { count: 473 } } } } }
  let(:activity) do
    models = %w[anthropic/claude-sonnet-4.6 openai/gpt-5.4 google/gemini-3-flash deepseek/deepseek-v4]
    (Date.new(2026, 10, 29)..Date.new(2026, 11, 11)).flat_map.with_index do |date, day|
      models.map.with_index do |model, index|
        scale = (1 + (day * 3 + index * 7) % 9) * (4 - index)
        {
          date: date.iso8601, model: model, usage: 0.31 * scale, byok_usage_inference: 0.05 * scale,
          prompt_tokens: 13500 * scale, completion_tokens: 4500 * scale,
          reasoning_tokens: 850 * scale, requests: 7 * scale
        }
      end
    end
  end
  let(:key_data) { JSON.parse(File.read(File.join(__dir__, 'fixtures/key.json'))).fetch('data') }
  let(:keys) do
    [
      key_data.merge('name' => 'Production', 'hash' => 'a' * 64),
      key_data.merge('name' => 'Research', 'hash' => 'b' * 64, 'usage_monthly' => 12.0)
    ]
  end

  let(:key_activity_mocks) do
    production, research = activity.partition.with_index { |_, index| index.even? }
    {
      "#{base}/keys?include_disabled=true" => { json: { data: keys } },
      "#{base}/activity?api_key_hash=#{'a' * 64}" => { json: { data: production } },
      "#{base}/activity?api_key_hash=#{'b' * 64}" => { json: { data: research } }
    }
  end

  def dashboard(preset, view, device: 'og_plus', now: '2026-11-12T12:00:00Z', fields: {}, mocks: {})
    trmnl.render(
      view: view, device: device, now: now,
      custom_fields: { dashboard_preset: preset, openrouter_management_key: 'test-management-key' }.merge(fields),
      mocks: trigger.merge(mocks).merge(/\A#{Regexp.escape(base)}\/activity\z/ => { json: { data: activity } })
    )
  end

  %w[overview models keys tokens].product(%w[full half_horizontal half_vertical quadrant], %w[og_plus v2]).each do |preset, view, device|
    it "renders the #{preset} preset in #{view} on #{device}" do
      options = preset == 'keys' ? { fields: { managed_key_filter: 'Production,Research' }, mocks: key_activity_mocks } : {}
      screen = dashboard(preset, view, device: device, **options)
      expect(screen).to have_no_problems.and(have_no_leaked_text).and(have_no_overflow).and(have_no_overlapping_text)
      expect(screen).to have_text(preset == 'keys' ? '2 selected keys' : 'Account activity')
      if view != 'quadrant'
        expect(screen).to have_css('.highcharts-root')
        expect(screen).to have_css(preset == 'overview' ? '.highcharts-line-series' : '.highcharts-column-series')
        if device == 'v2'
          chart_ratio = screen.evaluate(<<~JS)
            (() => {
              const chart = document.querySelector('.highcharts-root');
              return chart.getBoundingClientRect().height / chart.closest('.layout').getBoundingClientRect().height;
            })()
          JS
          expect(chart_ratio).to be > 0.5
        end
      end
      if preset == 'models' && view == 'full'
        tops = screen.evaluate('Highcharts.charts[0].series.map(series => series.points[0].shapeArgs.y)')
        expect(tops).to eq(tops.sort.reverse)
        expect(screen).to have_css('path.spend-column-caps', count: 1)
        caps = screen.evaluate("document.querySelector('.spend-column-caps').getAttribute('d')")
        expect(caps.scan(/M/).size).to eq(14)
      end
      if preset == 'keys'
        expect(screen.html).not_to include('a' * 64, 'b' * 64)
        if view != 'quadrant'
          expect(screen).to have_css('g.highcharts-series.highcharts-column-series', count: 2)
        end
      end
      expect(screen.html).not_to include('test-management-key')
    end
  end

  it 'shows labeled demo data without calling authenticated endpoints' do
    screen = trmnl.render(
      view: 'full', device: 'v2', now: '2026-11-12T12:00:00Z',
      custom_fields: { openrouter_api_key: 'demo', dashboard_preset: 'models' },
      mocks: trigger
    )
    expect(screen).to have_text('Demo data').and(have_text('Daily spend'))
    expect(screen).to have_css('g.highcharts-series.highcharts-column-series', count: 4)
    expect(screen.result).to have_a_mock_for_every_request
    expect(screen).to have_no_problems.and(have_no_overflow).and(have_no_overlapping_text)
  end

  it 'switches the metric, time window, and chart style' do
    screen = dashboard('models', 'full', device: 'v2',
                       fields: { chart_metric: 'requests', history_days: '7', chart_style: 'line' })
    expect(screen).to have_text('Daily requests').and(have_text('7 completed days'))
    expect(screen).to have_css('g.highcharts-series.highcharts-line-series', count: 4)
    expect(screen).to have_no_problems.and(have_no_overflow).and(have_no_overlapping_text)
  end

  it 'groups history by UTC week while keeping the window boundaries' do
    screen = dashboard('overview', 'full', fields: { time_grouping: 'weekly', chart_metric: 'requests' })
    expect(screen).to have_text('Weekly requests').and(have_text('14 completed days'))
    expected = activity.group_by do |row|
      date = Date.iso8601(row.fetch(:date))
      date - (date.cwday - 1)
    end.values.map { |week| week.sum { |row| row.fetch(:requests) } }
    expect(screen.evaluate('Highcharts.charts[0].xAxis[0].categories')).to eq(%w[10/29 11/02 11/09])
    expect(screen.evaluate('Highcharts.charts[0].series[0].points.map(point => point.y)')).to eq(expected)
    expect(screen).to have_no_problems.and(have_no_overflow).and(have_no_overlapping_text)
  end

  it 'draws a visible point when weekly history has only one bucket' do
    screen = dashboard('overview', 'full', now: '2026-11-16T12:00:00Z',
                       fields: { time_grouping: 'weekly', history_days: '7' })
    expect(screen).to have_text('Weekly spend')
    expect(screen).to have_css('.highcharts-markers .highcharts-point', count: 1)
    expect(screen).to have_no_problems.and(have_no_overflow).and(have_no_overlapping_text)
  end

  %w[full half_horizontal half_vertical quadrant].product(%w[og_plus v2]).each do |view, device|
    it "combines regular keys in #{view} on #{device}" do
      response = { json: { data: key_data } }
      screen = dashboard('keys', view, device: device,
                         fields: { openrouter_management_key: '', openrouter_api_key: 'Prod=key-one',
                                   openrouter_extra_keys: 'Research=key-two,key-one' },
                         mocks: { "#{base}/key" => response })
      expect(screen).to have_text('$51.00')
      if %w[full half_vertical].include?(view)
        expect(screen).to have_text('Prod').and(have_text('Research'))
        expect(screen).to have_text('26% used').and(have_text('$74.50 left of $100.00'))
        expect(screen).to have_css('.progress-dots .track', count: 2)
        expect(screen).to have_css('.progress-dots .dot--filled', count: 4)
      end
      expect(screen).to have_no_problems.and(have_no_overflow).and(have_no_overlapping_text)
      expect(screen.html).not_to include('key-one', 'key-two')
    end
  end

  %w[full half_vertical].product(%w[og_plus v2]).each do |view, device|
    it "fits all six regular keys without caps in #{view} on #{device}" do
      key_list = (1..6).map { |index| "Team #{index}=key-#{index}" }.join(',')
      response = { json: { data: key_data.merge('limit' => nil, 'limit_remaining' => nil) } }
      screen = dashboard('keys', view, device: device,
                         fields: { openrouter_management_key: '', openrouter_extra_keys: key_list },
                         mocks: { "#{base}/key" => response })
      expect(screen).to have_css('table tbody tr', count: 6)
      expect(screen).to have_text('Team 6').and(have_text('No cap'))
      expect(screen).to have_no_problems.and(have_no_overflow).and(have_no_overlapping_text)
    end
  end

  it 'shows a zero-activity state without drawing an empty chart' do
    screen = dashboard('models', 'full', mocks: { "#{base}/activity" => { json: { data: [] } } })
    expect(screen).to have_text('No activity in this window').and(have_text('$0.00'))
    expect(screen).not_to have_css('.highcharts-root')
  end

  it 'distinguishes an unavailable activity endpoint from a zero-usage window' do
    screen = dashboard('overview', 'full', mocks: { "#{base}/activity" => { status: 403 } })
    expect(screen).to have_text('Activity unavailable')
    expect(screen).not_to have_text('$0.00')
  end

  it 'shows unavailable activity when a response contains a malformed row' do
    screen = dashboard('models', 'full', mocks: { "#{base}/activity" => { json: { data: [activity.first, nil] } } })
    expect(screen).to have_text('Activity unavailable')
    expect(screen).not_to have_css('.highcharts-root')
  end

  it 'shows managed keys as unavailable when a response contains a malformed row' do
    screen = dashboard('keys', 'full', mocks: { "#{base}/keys?include_disabled=true" => { json: { data: [keys.first, nil] } } })
    expect(screen).to have_text('Managed keys unavailable')
    expect(screen).not_to have_text('No API keys found')
  end
end
