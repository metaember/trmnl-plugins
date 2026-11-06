# frozen_string_literal: true

RSpec.describe 'Better Battery' do
  displays = [
    { device: 'og_png' }, { device: 'og_png', orientation: :portrait },
    { device: 'og_plus' }, { device: 'og_plus', orientation: :portrait },
    { device: 'v2' }, { device: 'v2', orientation: :portrait }
  ]
  %w[full half_horizontal half_vertical quadrant].product(displays).each do |view, display|
    [0, 14, 85, 100].each do |percentage|
      it "draws #{percentage}% in #{view} on #{TRMNLP::Testing.screen_name(display)}" do
        screen = trmnl.render(view:, **display,
                              variables: { trmnl: { device: { percent_charged: percentage } } },
                              custom_fields: { include_percentage: 'true' })
        expect(screen).to have_no_problems.and(have_no_leaked_text).and(have_no_overflow)
          .and(have_no_overlapping_text).and(fit_image_size_limit)
        expect(screen).to have_text("#{percentage}%")
        expect(screen).to have_css('svg[aria-label="Battery charge"]')
      end
    end

    it "hides numeric percentage in #{view} on #{TRMNLP::Testing.screen_name(display)}" do
      screen = trmnl.render(view:, **display, custom_fields: { include_percentage: 'false' })
      expect(screen).to have_no_problems.and(have_no_leaked_text).and(have_no_overflow)
        .and(have_no_overlapping_text)
      expect(screen.text).not_to include('%')
      expect(screen).to have_css('svg[aria-label="Battery charge"]')
    end
  end

  %w[full half_horizontal half_vertical quadrant].each do |view|
    it "retains content in dark #{view}" do
      light = trmnl.render(view:, device: 'v2')
      dark = trmnl.render(view:, device: 'v2', dark_mode: true)
      expect(dark).to keep_the_content_of(light).and(keep_each_image_of(light)).and(have_no_overflow)
    end

    it "shows missing battery data in #{view}" do
      screen = trmnl.render(view:, variables: { trmnl: { device: { percent_charged: nil } } })
      expect(screen).to have_text('No battery data').and(have_no_problems).and(have_no_overflow)
      expect(screen.text).not_to include('0%')
    end
  end
end
