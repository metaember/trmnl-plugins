# frozen_string_literal: true

require "json"

RSpec.describe "AI Prompt Frame" do
  let(:endpoint) { "POST https://openrouter.ai/api/v1/chat/completions" }
  let(:now) { Time.utc(2026, 11, 13, 1, 5) }
  let(:event_response) { fixture("events") }
  let(:mocks) { { endpoint => { json: event_response } } }
  let(:custom_fields) { { api_key: "test-key", city: "Brooklyn, NY" } }
  let(:variables) { { trmnl: { user: { utc_offset: -18_000, time_zone_iana: "America/New_York" } } } }

  def fixture(name)
    JSON.parse(File.read(File.join(__dir__, "fixtures", "#{name}.json")))
  end

  it "sends a structured web request with the preset's city and local time" do
    result = trmnl.transform(mocks:, now:, custom_fields:, variables:)
    expect(result).to have_a_mock_for_every_request.and(stay_within_serverless_limits)
    expect(result.requests.size).to eq(1)
    request = result.requests.first
    body = JSON.parse(request.fetch(:body))
    expect(request.fetch(:headers).transform_keys(&:downcase).fetch("authorization")).to eq("Bearer test-key")
    expect(body.fetch("messages").last.fetch("content")).to include("Brooklyn, NY", "2026-11-12", "20:05")
    expect(body.fetch("tools").map { |tool| tool.fetch("type") }).to eq(%w[openrouter:web_search openrouter:web_fetch])
    expect(body.fetch("stop_server_tools_when")).to eq([{ "type" => "step_count_is", "step_count" => 3 }])
    expect(body.dig("response_format", "json_schema", "strict")).to eq(true)
    expect(body.dig("response_format", "json_schema", "schema", "properties", "mode", "enum"))
      .to contain_exactly("answer", "list", "metric", "quote", "compare", "bullets", "timeline",
                          "article", "table", "bar", "line", "area", "no_results")
    expect(body.to_json).not_to include("test-key")
  end

  it "JSON encodes custom prompts and leaves web tools off by default" do
    # The preview tool renders its field values for env interpolation before the polling template.
    fields = custom_fields.merge(preset: "custom", layout: "answer", context: "Sourdough",
                                 prompt: "{% raw %}Explain \"browning\".\nToday is {{date}}. Context: {{context}}.{% endraw %}")
    result = trmnl.transform(mocks: { endpoint => { json: fixture("answer") } }, now:, custom_fields: fields, variables:)
    body = JSON.parse(result.requests.first.fetch(:body))
    expect(body.fetch("messages").last.fetch("content")).to eq("Explain \"browning\".\nToday is 2026-11-12. Context: Sourdough.")
    expect(body).not_to have_key("tools")
    expect(result.data.dig("brief", "mode")).to eq("answer")
  end

  it "avoids polling until the required settings are entered" do
    [{ api_key: "" }, { city: "" }, { preset: "custom", prompt: "" }, { layout: "image" }].each do |missing|
      result = trmnl.transform(mocks:, custom_fields: custom_fields.merge(missing))
      expect(result.requests).to be_empty
      expect(result.data["notice"]).to be_a(String)
    end
  end

  %w[og_png v2].product({ "full" => 3, "half_horizontal" => 2, "half_vertical" => 3, "quadrant" => 1 }.to_a).each do |device, (view, count)|
    it "draws #{count} ranked picks in #{view} on #{device}" do
      screen = trmnl.render(view:, device:, mocks:, now:, custom_fields:, variables:)
      expect(screen).to have_no_problems.and(have_no_overflow).and(have_no_leaked_text).and(have_no_transform_error)
      expect(screen).to have_css(".layout .item", count:)
      expect(screen).to have_css('a[href="https://garden.example/events/jazz"]', exact_text: "garden.example")
      expect(screen).to have_text("Jazz in the garden")
    end
  end

  it "keeps the previous brief visible after a failed request" do
    good = trmnl.transform(mocks:, now:, custom_fields:, variables:)
    screen = trmnl.render(view: "quadrant", state: good.state, now:, custom_fields:, variables:,
                          mocks: { endpoint => { status: 500, body: "" } })
    expect(screen).to have_no_problems.and(have_no_overflow).and(have_no_transform_error)
    expect(screen).to have_text("Jazz in the garden").and(have_text("Previous"))
  end

  it "fits the full brief on a portrait TRMNL X" do
    screen = trmnl.render(view: "full", device: "v2", orientation: :portrait, mocks:, now:, custom_fields:, variables:)
    expect(screen).to have_no_problems.and(have_no_overflow).and(have_no_overlapping_text)
    expect(screen).to have_css(".layout .item", count: 3)
  end

  it "contains long model output within full and quadrant OG layouts" do
    result = JSON.parse(event_response.dig("choices", 0, "message", "content"))
    result["headline"] = "A very long headline for the upcoming exhibitions, workshops, and performances"
    result.fetch("items").each do |item|
      item["title"] = "An unusually long name for a local event with multiple performers"
      item["detail"] = "7:00 PM · At the main auditorium across from the historic station · Tickets available at the venue, subject to availability"
    end
    event_response.dig("choices", 0, "message")["content"] = result.to_json
    %w[full quadrant].each do |view|
      screen = trmnl.render(view:, device: "og_png", mocks:, now:, custom_fields:, variables:)
      expect(screen).to have_no_problems.and(have_no_overflow).and(have_no_overlapping_text)
    end
  end

  describe "layout gallery" do
    let(:image_url) { "https://images.example/landscape.png" }
    let(:fields) { custom_fields.merge(preset: "custom", prompt: "Use the requested layout.") }
    let(:examples) { fixture("layouts") }

    def layout_response(mode)
      response = fixture("answer")
      return { endpoint => { json: response } } if mode == "answer"

      value = { "mode" => mode, "value" => "", "answer" => "", "source_url" => "",
                "items" => [], "columns" => [], "rows" => [], "points" => [] }.merge(examples.fetch(mode))
      response.dig("choices", 0, "message")["content"] = value.to_json
      { endpoint => { json: response } }
    end

    %w[answer metric quote compare image bullets timeline article table bar line area]
      .product(%w[full half_horizontal half_vertical quadrant]).each do |mode, view|
      it "renders #{mode} in #{view} on OG" do
        settings = mode == "image" ? fields.merge(image_url:) : fields.merge(layout: mode)
        assets = mode == "image" ? { image_url => "tests/fixtures/landscape.png" } : {}
        screen = trmnl.render(view:, device: "og_png", now:, custom_fields: settings,
                              mocks: layout_response(mode), asset_overrides: assets)
        expect(screen).to have_no_problems.and(have_no_overflow).and(have_no_leaked_text).and(have_no_transform_error)
        compact = %w[half_horizontal quadrant].include?(view)
        case mode
        when "bar", "line", "area"
          expect(screen).to have_text(examples.fetch(mode).fetch("value")).and(have_css(".highcharts-#{mode}-series"))
          expect(screen.evaluate("Highcharts.charts[0].series[0].points.map(p => p.y)"))
            .to eq(examples.fetch(mode).fetch("points").map { |point| point.fetch("value") })
        when "table"
          expect(screen).to have_css("th", count: 3).and(have_css("tbody tr", count: compact ? 3 : 6))
          expect(screen).to have_text("3 of 6 rows") if compact
        when "bullets", "timeline"
          selector = mode == "bullets" ? "ul li" : "ol li"
          count = mode == "bullets" ? (compact ? 3 : 5) : (compact ? 2 : 4)
          expect(screen).to have_css(selector, count:)
        when "article"
          count = compact ? 1 : (view == "half_vertical" ? 2 : 3)
          expect(screen).to have_css("article p", count:)
          expect(screen).to have_text("A large window spreads light")
        when "image"
          expect(screen).to have_text("Above the valley").and(have_css("figure img.image-dither"))
          expect(screen.evaluate("document.querySelector('figure img').naturalWidth")).to be > 0
          expect(screen.box("figure img").bottom).to be <= screen.box("figcaption").top
        when "compare"
          expect(screen).to have_text("Train").and(have_text("Bike"))
          expect(screen).not_to have_css(".index")
          if view != "half_vertical"
            tops = screen.evaluate("Array.from(document.querySelectorAll('.item .title'), el => el.getBoundingClientRect().top)")
            expect(tops.first).to be_within(1).of(tops.last)
          end
        else
          expect(screen).to have_text({ "answer" => "golden crust", "metric" => "1,240", "quote" => "Field notes" }.fetch(mode))
        end
      end
    end

    it "fits the image and caption on a portrait TRMNL X" do
      screen = trmnl.render(view: "full", device: "v2", orientation: :portrait, now:,
                            custom_fields: fields.merge(layout: "image", image_url:), mocks: layout_response("image"),
                            asset_overrides: { image_url => "tests/fixtures/landscape.png" })
      expect(screen).to have_no_problems.and(have_no_overflow).and(have_no_transform_error)
      expect(screen).to have_text("Above the valley").and(have_text("Layered ridges"))
    end

    %w[bar line area table article].each do |mode|
      it "draws #{mode} at full size on TRMNL X" do
        screen = trmnl.render(view: "full", device: "v2", now:, custom_fields: fields.merge(layout: mode),
                              mocks: layout_response(mode))
        expect(screen).to have_no_problems.and(have_no_overflow).and(have_no_overlapping_text)
        expect(screen).to have_text(examples.fetch(mode).fetch("headline"))
        expect(screen).to have_css(".highcharts-#{mode}-series") if %w[bar line area].include?(mode)
      end
    end

    it "labels the visible subset of an eight-category bar chart in a quadrant" do
      response = fixture("answer")
      data = { mode: "bar", headline: "Trip durations", value: "Minutes", answer: "", items: [], source_url: "",
               points: (1..8).map { |index| { label: "Stop #{index}", value: index * 4 } } }
      response.dig("choices", 0, "message")["content"] = data.to_json
      screen = trmnl.render(view: "quadrant", device: "og_png", now:, custom_fields: fields.merge(layout: "bar"),
                            mocks: { endpoint => { json: response } })
      expect(screen).to have_no_problems.and(have_no_overflow)
      expect(screen).to have_text("First 5 of 8 categories")
      expect(screen.evaluate("Highcharts.charts[0].series[0].points.map(p => p.y)")).to eq([4, 8, 12, 16, 20])
    end

    it "preserves citations in a compact bulleted brief" do
      response = fixture("answer")
      message = response.dig("choices", 0, "message")
      url = "https://museum.example/plan-your-visit"
      data = examples.fetch("bullets")
      data.fetch("items").each do |item|
        item["source_url"] = url
        item["title"] += " before heading out, especially if you expect to arrive late in the day."
      end
      message["content"] = data.merge("mode" => "bullets", "answer" => "", "source_url" => "").to_json
      message["annotations"] = [{ type: "url_citation", url_citation: { url: } }]
      screen = trmnl.render(view: "quadrant", device: "og_png", now:, custom_fields: fields.merge(layout: "bullets", web: "on"),
                            mocks: { endpoint => { json: response } })
      expect(screen).to have_no_problems.and(have_no_overflow)
      expect(screen).to have_css("ul li a", count: 2)
    end
  end
end
