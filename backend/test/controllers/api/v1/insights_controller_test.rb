require "test_helper"

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
    assert_equal [1, 100_000, "INR"], [india["headcount"], india["usd"]["median"], india["local"]["currency"]]
  end
end
