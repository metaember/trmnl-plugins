# frozen_string_literal: true

require 'json'

RSpec.describe 'Space Terminal' do
  config = JSON.parse(File.read('.preflight.json'))
  screens = config.fetch('scenarios')
  slots = %w[full half_horizontal half_vertical quadrant]
  displays = %w[og_png v2].product(%w[landscape portrait])

  screens.each do |preset, scenario|
    views = %w[signal_intercept surface_survey].include?(preset) ? slots : %w[full]
    profiles = views == slots ? displays : [displays.first]
    profiles.product(views).each do |(device, orientation), view|
      it "renders #{preset} on #{device} #{orientation} #{view}" do
        screen = trmnl.render(device: device, orientation: orientation, view: view, now: scenario.fetch('now'),
                              custom_fields: scenario.fetch('custom_fields'))
        expect(screen).to have_text(scenario.fetch('expect_text')).and(have_no_transform_error)
          .and(have_no_problems).and(have_no_overflow).and(have_no_overlapping_text)
        if preset == 'surface_survey' && (view != 'full' || orientation == 'portrait')
          expect(screen.evaluate(<<~JS)).to eq(true)
            (() => {
              const maps = [...document.querySelectorAll('.terminal-fraction-survey-map img')];
              const visible = maps.filter(map => map.getBoundingClientRect().width > 0);
              if (visible.length !== 1 || !visible[0].complete || visible[0].naturalWidth === 0) return false;
              const svg = atob(visible[0].src.split(',')[1]);
              return svg.includes('fill="url(#survey-deep-stipple)"') ||
                svg.includes('fill="#aaa"') || svg.includes('fill="#bbb"');
            })()
          JS
        end
      end
    end
  end

  it 'generates a boarding pass with shipped defaults' do
    preview = config.fetch('default_preview')
    screen = trmnl.render(view: 'quadrant', device: 'og_png', now: preview.fetch('now'))
    expect(screen).to have_text(preview.fetch('expect_text')).and(have_no_transform_error)
  end
end
