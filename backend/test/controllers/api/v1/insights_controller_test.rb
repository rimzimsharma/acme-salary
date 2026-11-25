require "test_helper"
require "minitest/mock"

class Api::V1::InsightsControllerTest < ActionDispatch::IntegrationTest
  def json = response.parsed_body

  test "GET summary returns the headline figures" do
    create_employee(country: "India", currency: "INR", annual_salary: 8_300_000)
    get "/api/v1/insights/summary"
    assert_response :success
    assert_equal 1, json["headcount"]
    assert_equal 100_000, json["total_payroll_usd"]
    assert_equal 100_000, json["usd"]["median"]
  end

  test "GET breakdown groups pay by the requested dimension" do
    create_employee(country: "India", currency: "INR", annual_salary: 8_300_000)
    create_employee(country: "Japan", currency: "JPY", annual_salary: 15_000_000)
    get "/api/v1/insights/breakdown", params: { by: "country" }
    assert_response :success
    assert_equal "country", json["by"]
    assert_equal %w[India Japan], json["groups"].map { |g| g["key"] }.sort
    india = json["groups"].find { |g| g["key"] == "India" }
    assert_equal [ 1, 100_000, "INR" ], [ india["headcount"], india["usd"]["median"], india["local"]["currency"] ]
  end

  test "GET breakdown with an unknown dimension is a 400, not a 500" do
    get "/api/v1/insights/breakdown", params: { by: "email" }
    assert_response :bad_request
    assert_match(/unknown grouping/, json["error"])
    get "/api/v1/insights/breakdown"
    assert_response :bad_request
  end

  test "GET breakdown filters drill down within a dimension" do
    create_employee(country: "India", job_title: "Recruiter")
    create_employee(country: "Japan", currency: "JPY", job_title: "Accountant")
    get "/api/v1/insights/breakdown", params: { by: "job_title", country: "India" }
    assert_equal [ "Recruiter" ], json["groups"].map { |g| g["key"] }
  end

  test "GET outliers lists people paid far from their peers, honouring limit" do
    5.times { create_employee(annual_salary: 100_000, currency: "USD", country: "United States") }
    create_employee(annual_salary: 300_000, currency: "USD", country: "United States", full_name: "Very High")
    create_employee(annual_salary: 20_000, currency: "USD", country: "United States", full_name: "Very Low")
    get "/api/v1/insights/outliers"
    assert_response :success
    assert_equal [ "Very High", "Very Low" ], json["outliers"].map { |o| o["full_name"] }
    get "/api/v1/insights/outliers", params: { limit: 1 }
    assert_equal 1, json["outliers"].size
  end

  test "outliers limit is clamped to 1..200 and defaults when omitted" do
    seen = []
    Insights::Outliers.stub(:call, ->(**args) { seen << args; [] }) do
      get "/api/v1/insights/outliers", params: { limit: 999 }
      get "/api/v1/insights/outliers", params: { limit: 0 }
      get "/api/v1/insights/outliers"
    end
    assert_equal [ { limit: 200 }, { limit: 1 }, {} ], seen
  end
end
