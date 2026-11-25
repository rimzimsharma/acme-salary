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

  test "GET show returns one employee, including inactive ones" do
    employee = create_employee(full_name: "Asha Rao").tap(&:deactivate!)
    get "/api/v1/employees/#{employee.id}"
    assert_response :success
    assert_equal "Asha Rao", json["data"]["full_name"]
    assert_equal false, json["data"]["active"]
  end

  test "GET show for a missing id is a JSON 404" do
    get "/api/v1/employees/0"
    assert_response :not_found
    assert_equal "Employee not found", json["error"]
  end

  VALID = { full_name: "Asha Rao", email: "asha@acme.test", job_title: "Engineer", department: "Engineering",
            country: "India", currency: "INR", annual_salary: 2_400_000, seniority: "mid", hire_date: "2022-03-01" }.freeze

  test "POST create makes an employee and returns 201 with Location" do
    assert_difference "Employee.count", 1 do
      post "/api/v1/employees", params: { employee: VALID }
    end
    assert_response :created
    assert_equal "Asha Rao", json["data"]["full_name"]
    assert_match %r{/api/v1/employees/\d+\z}, response.headers["Location"]
  end

  test "POST create with bad data returns 422 and field errors, saving nothing" do
    assert_no_difference "Employee.count" do
      post "/api/v1/employees", params: { employee: VALID.merge(email: "nope", annual_salary: -1, seniority: "wizard") }
    end
    assert_response :unprocessable_entity
    assert_equal %w[annual_salary email seniority], json["errors"].keys.sort
  end

  test "POST create ignores attributes it does not permit (id, active)" do
    post "/api/v1/employees", params: { employee: VALID.merge(id: 999, active: false) }
    assert_response :created
    assert_not_equal 999, json["data"]["id"]
    assert_equal true, json["data"]["active"]
  end
end
