# frozen_string_literal: true

require 'json'

RSpec.describe 'Display boundaries' do
  let(:now) { Time.utc(2026, 11, 6, 12) }
  let(:catalog) { JSON.parse(File.read(File.join(__dir__, 'fixtures/models.json'))) }

  screens = [
    { device: 'og_png' }, { device: 'og_png', orientation: :portrait },
    { device: 'v2' }, { device: 'v2', orientation: :portrait }
  ]
  %w[full half_horizontal half_vertical quadrant].product(screens).each do |view, display|
    %w[long_list single_model missing_metadata].each do |scenario|
      it "fits #{scenario} in #{view} on #{TRMNLP::Testing.screen_name(display)}" do
        models = catalog.fetch('data').reject { it.fetch('id').start_with?('openrouter/') }.first(5)
        if scenario == 'missing_metadata'
          models.each { it.delete('pricing'); it.delete('context_length'); it.delete('description') }
        else
          models.each do |model|
            model['name'] = 'OpenRouter Catalog Model With A Very Long Organization And Model Name Preview Edition 2026'
            model['description'] = [model.fetch('description'), model.fetch('description')].join(' ')
          end
          models = models.first(1) if scenario == 'single_model'
        end
        screen = trmnl.render(view:, **display, now:, mocks: { '*' => { json: { data: models } } })
        expect(screen).to have_no_problems.and(have_no_leaked_text).and(have_no_overflow)
          .and(have_no_overlapping_text).and(have_no_text_clamped_with_room_to_spare)
          .and(fit_image_size_limit)
        expect(screen).to have_css('.layout').and(have_css('.title_bar'))
        expect(screen).not_to have_text('Catalog unavailable')
      end
    end
  end

  screens.each do |display|
    it "describes missing text-model prices accurately on #{TRMNLP::Testing.screen_name(display)}" do
      model = catalog.fetch('data').find do |entry|
        !entry.fetch('id').start_with?('openrouter/') && entry.dig('architecture', 'output_modalities') == ['text']
      end
      model.delete('pricing')
      screen = trmnl.render(view: 'full', **display, now:, mocks: { '*' => { json: { data: [model] } } })
      expect(screen).to have_no_problems.and(have_no_leaked_text).and(have_no_overflow)
        .and(have_no_overlapping_text).and(fit_image_size_limit)
      expect(screen).to have_css('tbody tr td', text: 'Not listed', count: 2)
      expect(screen).not_to have_text('Media output:')
    end
  end
end
