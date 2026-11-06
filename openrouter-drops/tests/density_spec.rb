# frozen_string_literal: true

require 'json'

RSpec.describe 'Full-screen model density' do
  let(:now) { Time.utc(2026, 11, 6, 12) }
  let(:mocks) do
    { '*' => { json: JSON.parse(File.read(File.join(__dir__, 'fixtures/models.json'))) } }
  end

  displays = [
    { device: 'og_png' }, { device: 'og_png', orientation: :portrait },
    { device: 'og_plus' }, { device: 'og_plus', orientation: :portrait },
    { device: 'v2' }, { device: 'v2', orientation: :portrait }
  ]
  displays.product(%w[newest cost context]).each do |display, sort|
    it "uses the available full-screen space for #{sort} on #{TRMNLP::Testing.screen_name(display)}" do
      screen = trmnl.render(view: 'full', **display, mocks:, now:,
                            custom_fields: { sort_by: sort, model_type: 'all', added_within: 'all' })
      expect(screen).to have_no_problems.and(have_no_leaked_text).and(have_no_overflow)
        .and(have_no_overlapping_text).and(have_no_text_clamped_with_room_to_spare)
        .and(fit_image_size_limit)
      rows = screen.evaluate(<<~JS)
        [...document.querySelectorAll('tbody tr')]
          .filter(row => row.checkVisibility() && row.querySelectorAll('td').length > 1)
          .map(row => row.getBoundingClientRect().toJSON())
      JS
      minimum = display[:device] == 'v2' ? 10 : 5
      expect(rows.length).to be >= minimum
      expect(rows.first.fetch('top')).to be < screen.box('.layout').height * 0.3
      # Sufficient catalog rows should reach the lower screen, without a floating disclaimer gap.
      expect(rows.last.fetch('bottom')).to be > screen.box('.layout').height * 0.7
    end
  end
end
