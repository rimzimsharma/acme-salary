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
end
