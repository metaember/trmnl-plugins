# frozen_string_literal: true

require 'json'

RSpec.describe 'OpenRouter Spend' do
  let(:trigger) { 'https://openrouter.ai/api/v1/models/count' }
  let(:url) { 'https://openrouter.ai/api/v1/key' }
  let(:payload) { JSON.parse(File.read(File.join(__dir__, 'fixtures/key.json'))) }

  def render_spend(view, response, **options)
    trmnl.render(
      view: view,
      mocks: { trigger => { json: { data: { count: 473 } } }, url => { json: response } },
      custom_fields: { openrouter_api_key: 'test-only-key' },
      **options
    )
  end

  %w[full half_horizontal half_vertical quadrant].product(%w[og_plus v2]).each do |view, device|
    it "shows monthly and daily spend in #{view} on #{device}" do
      screen = render_spend(view, payload, device: device)
      expect(screen).to have_no_problems.and(have_no_leaked_text).and(have_no_overflow).and(have_no_overlapping_text)
      expect(screen).to have_text('$25.50').and(have_text('$1.27'))
      expect(screen.html).not_to include('test-only-key')
    end
  end

  it 'shows the provider-reported remaining budget and cap' do
    screen = render_spend('full', payload)
    expect(screen).to have_text('$74.50').and(have_text('Monthly key cap')).and(have_text('$100.00'))
    expect(screen).to have_text('$8.63').and(have_text('$103.41'))
    expect(screen).not_to have_text('$17.38')
  end

  it 'distinguishes uncapped spend, zero and sub-cent spend' do
    payload['data'].merge!('limit' => nil, 'limit_remaining' => nil, 'limit_reset' => nil,
                           'usage_daily' => 0, 'usage_weekly' => 0.001)
    screen = render_spend('full', payload)
    expect(screen).to have_text('No key cap').and(have_text('$0.00')).and(have_text('<$0.01'))
    expect(screen).not_to have_text('Remaining')
  end

  it 'shows a depleted cap without hiding a zero balance' do
    payload['data'].merge!('limit_remaining' => 0)
    screen = render_spend('full', payload)
    expect(screen).to have_text('Remaining').and(have_text('$0.00'))
  end

  it 'fits six-figure spend in the smallest layout' do
    payload['data'].merge!('usage_daily' => 123_456.78, 'usage_monthly' => 987_654.32)
    screen = render_spend('quadrant', payload)
    expect(screen).to have_text('$123,456.78').and(have_text('$987,654.32'))
    expect(screen).to have_no_overflow.and(have_no_overlapping_text)
  end

  it 'shows missing usage as unavailable' do
    screen = render_spend('quadrant', { error: { code: 401 } })
    expect(screen).to have_text('Spend unavailable')
    expect(screen).not_to have_text('$0.00')
  end
end
