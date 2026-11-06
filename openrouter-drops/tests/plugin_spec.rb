# frozen_string_literal: true

# This plugin's tests, run with `trmnlp test` (add `--report report` for a page of every screen it drew).
# Docs: https://github.com/usetrmnl/trmnlp#testing-plugins
require 'json'

RSpec.describe 'OpenRouter Drops' do
  let(:mocks) do
    { 'https://openrouter.ai/api/v1/models' => {
      json: JSON.parse(File.read(File.join(__dir__, 'fixtures/models.json')))
    } }
  end
  let(:now) { Time.utc(2026, 11, 6, 12) }

  it_behaves_like 'a publishable recipe'

  %w[full half_horizontal half_vertical quadrant].each do |view|
    it "shows the newest real listing in #{view}" do
      screen = trmnl.render(view:, mocks:, now:)
      expect(screen).to have_no_problems.and(have_no_leaked_text).and(have_no_overflow)
      expect(screen.html).to include('Google: Gemini Omni 1.2 Flash', '2026-11-05', '$1.5')
    end

    it "shows an explicit empty state in #{view}" do
      screen = trmnl.render(view:, mocks: { '*' => { json: { data: [] } } }, now:)
      expect(screen).to have_no_problems.and(have_no_leaked_text).and(have_no_overflow)
      expect(screen.html).to include('No matching models')
    end

    it "applies cost sorting and token mix in #{view}" do
      fields = { sort_by: 'cost', model_type: 'text', added_within: 'all', token_mix: '1to1' }
      screen = trmnl.render(view:, mocks:, now:, custom_fields: fields)
      expect(screen).to have_no_problems.and(have_no_leaked_text).and(have_no_overflow).and(have_no_overlapping_text)
      expect(screen.html).to include('Recursive: Flint (free)', '$0', '1:1')
    end

    it "explains incompatible media and cost filters in #{view}" do
      screen = trmnl.render(view:, mocks:, now:, custom_fields: { sort_by: 'cost', model_type: 'video' })
      expect(screen).to have_no_problems.and(have_no_leaked_text).and(have_no_overflow)
      expect(screen.html).to include('No matching models', 'comparable token prices')
    end
  end

end
