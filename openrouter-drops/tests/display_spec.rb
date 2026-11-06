# frozen_string_literal: true

require 'json'

RSpec.describe 'Display settings matrix' do
  let(:now) { Time.utc(2026, 11, 6, 12) }
  let(:mocks) do
    { 'https://openrouter.ai/api/v1/models' => {
      json: JSON.parse(File.read(File.join(__dir__, 'fixtures/models.json')))
    } }
  end

  displays = [
    { device: 'og_png' }, { device: 'og_png', orientation: :portrait },
    { device: 'og_plus' }, { device: 'og_plus', orientation: :portrait },
    { device: 'v2' }, { device: 'v2', orientation: :portrait }
  ]
  profiles = {
    'recent text cost 3:1' => { sort_by: 'cost', model_type: 'text', added_within: '30', token_mix: '3to1' },
    'recent vision cost 1:1' => { sort_by: 'cost', model_type: 'vision', added_within: '7', token_mix: '1to1' },
    'largest context 9:1' => { sort_by: 'context', model_type: 'all', added_within: '90', token_mix: '9to1' },
    'image output' => { sort_by: 'newest', model_type: 'image', added_within: 'all', token_mix: '1to1' },
    'audio input or output' => { sort_by: 'newest', model_type: 'audio', added_within: 'all', token_mix: '9to1' },
    'video output' => { sort_by: 'newest', model_type: 'video', added_within: 'all', token_mix: '3to1' },
    'no comparable image costs' => { sort_by: 'cost', model_type: 'image', added_within: 'all', token_mix: '3to1' },
    'newest within a week' => { sort_by: 'newest', model_type: 'all', added_within: '7', token_mix: '3to1' }
  }

  %w[full half_horizontal half_vertical quadrant].product(displays).each do |view, display|
    profiles.each do |label, fields|
      it "fits #{label} in #{view} on #{TRMNLP::Testing.screen_name(display)}" do
        screen = trmnl.render(view:, **display, mocks:, now:, custom_fields: fields)
        expect(screen).to have_no_problems.and(have_no_leaked_text).and(have_no_overflow)
          .and(have_no_overlapping_text).and(have_no_text_clamped_with_room_to_spare)
          .and(fit_image_size_limit)
        expect(screen).to have_css('.layout').and(have_css('.title_bar'))
        if label == 'no comparable image costs'
          expect(screen).to have_text('No matching models')
        else
          expect(screen).not_to have_text('No matching models')
          expect(screen).not_to have_text('Catalog unavailable')
        end
      end
    end

    it "keeps filtered content readable in dark #{view} on #{TRMNLP::Testing.screen_name(display)}" do
      fields = profiles.fetch('recent text cost 3:1')
      light = trmnl.render(view:, **display, mocks:, now:, custom_fields: fields)
      dark = trmnl.render(view:, **display, mocks:, now:, custom_fields: fields, dark_mode: true)
      expect(dark).to have_no_problems.and(have_no_leaked_text).and(have_no_overflow)
        .and(have_no_overlapping_text).and(keep_the_content_of(light)).and(fit_image_size_limit)
    end

    it "fits a failed API state in #{view} on #{TRMNLP::Testing.screen_name(display)}" do
      screen = trmnl.render(view:, **display, now:, mocks: { '*' => { status: 500, body: '' } })
      expect(screen).to have_no_problems.and(have_no_leaked_text).and(have_no_overflow)
        .and(have_no_overlapping_text).and(have_no_transform_error).and(fit_image_size_limit)
      expect(screen).to have_text('Catalog unavailable')
    end
  end

  %w[half_vertical quadrant].product(displays).each do |view, display|
    it "keeps the complete price units visible in #{view} on #{TRMNLP::Testing.screen_name(display)}" do
      screen = trmnl.render(view:, **display, mocks:, now:,
                            custom_fields: profiles.fetch('recent text cost 3:1'))
      expect(screen).to have_no_problems.and(have_no_leaked_text).and(have_no_overflow)
        .and(have_no_overlapping_text).and(fit_image_size_limit)
      expect(screen).to have_css('.title_bar .title', exact_text: 'OpenRouter')
      expect(screen).to have_css('.title_bar .instance', exact_text: 'USD / 1M')
    end
  end
end
