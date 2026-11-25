require "test_helper"

class CorsTest < ActionDispatch::IntegrationTest
  test "the Next.js dev origin may call the API" do
    get "/api/v1/employees", headers: { "Origin" => "http://localhost:3000" }
    assert_equal "http://localhost:3000", response.headers["Access-Control-Allow-Origin"]
  end

  test "preflight for write methods is allowed from the frontend origin" do
    process :options, "/api/v1/employees", headers: {
      "Origin" => "http://localhost:3000", "Access-Control-Request-Method" => "POST",
      "Access-Control-Request-Headers" => "content-type"
    }
    assert_equal "http://localhost:3000", response.headers["Access-Control-Allow-Origin"]
    assert_includes response.headers["Access-Control-Allow-Methods"], "PATCH"
  end

  test "other origins get no CORS headers" do
    get "/api/v1/employees", headers: { "Origin" => "https://evil.example" }
    assert_nil response.headers["Access-Control-Allow-Origin"]
  end
end
