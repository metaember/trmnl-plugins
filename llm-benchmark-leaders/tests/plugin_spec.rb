# frozen_string_literal: true

require 'json'

RSpec.describe 'LLM Benchmark Leaders' do
  let(:mocks) do
    { 'https://api.zeroeval.com/leaderboard/models/full?justCanonicals=true' => {
      json: JSON.parse(File.read(File.join(__dir__, 'fixtures/models.json')))
    } }
  end
  let(:now) { Time.utc(2026, 11, 6, 12) }
  it_behaves_like 'a publishable recipe'

  %w[full half_horizontal half_vertical quadrant].each do |view|
    %i[landscape portrait].each do |orientation|
      it "fits #{view} in #{orientation}" do
        screen = trmnl.render(view:, orientation:, device: 'og_png', mocks:, now:)
        expect(screen).to have_no_problems.and(have_no_leaked_text).and(have_no_overflow)
          .and(have_no_overlapping_text).and(fit_image_size_limit)
        expect(screen).to have_css('.layout').and(have_css('.title_bar'))
      end
    end
  end
end
