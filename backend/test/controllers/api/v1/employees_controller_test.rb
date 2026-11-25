require "test_helper"

class Api::V1::EmployeesControllerTest < ActionDispatch::IntegrationTest
  def json = response.parsed_body

  test "GET index returns employees under data with pagination meta" do
    create_employee(full_name: "Asha Rao")
    get "/api/v1/employees"
    assert_response :success
    assert_equal ["Asha Rao"], json["data"].map { |e| e["full_name"] }
    assert_equal({ "page" => 1, "per_page" => 25, "total" => 1, "total_pages" => 1 }, json["meta"])
  end

  test "GET index passes filters, search, sort and paging to the query" do
    create_employee(country: "Japan", currency: "JPY", full_name: "Kenji A")
    create_employee(country: "Japan", currency: "JPY", full_name: "Kenji B")
    create_employee(country: "Japan", currency: "JPY", full_name: "Kenji C")
    create_employee(country: "India", full_name: "Kenji D")
    get "/api/v1/employees", params: { country: "Japan", q: "kenji", sort: "full_name", dir: "desc", page: 2, per_page: 2 }
    assert_equal ["Kenji A"], json["data"].map { |e| e["full_name"] }
    assert_equal({ "page" => 2, "per_page" => 2, "total" => 3, "total_pages" => 2 }, json["meta"])
  end

  test "each employee includes a USD-normalised salary using the fixed reference rates" do
    create_employee(currency: "INR", annual_salary: 8_300_000)
    get "/api/v1/employees"
    assert_equal 100_000, json["data"].first["annual_salary_usd"]
    assert_equal 8_300_000, json["data"].first["annual_salary"]
  end
end
