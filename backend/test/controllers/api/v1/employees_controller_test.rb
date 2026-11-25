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

  test "PATCH update changes permitted fields" do
    employee = create_employee(annual_salary: 2_000_000)
    patch "/api/v1/employees/#{employee.id}", params: { employee: { annual_salary: 2_500_000, job_title: "Staff Engineer" } }
    assert_response :success
    assert_equal [2_500_000, "Staff Engineer"], [employee.reload.annual_salary, employee.job_title]
    assert_equal 2_500_000, json["data"]["annual_salary"]
  end

  test "PATCH update with bad data returns 422 and leaves the record unchanged" do
    employee = create_employee(annual_salary: 2_000_000)
    patch "/api/v1/employees/#{employee.id}", params: { employee: { annual_salary: 0 } }
    assert_response :unprocessable_entity
    assert_equal ["must be greater than 0"], json["errors"]["annual_salary"]
    assert_equal 2_000_000, employee.reload.annual_salary
  end

  test "PATCH cannot reactivate or deactivate through attribute params" do
    employee = create_employee
    patch "/api/v1/employees/#{employee.id}", params: { employee: { active: false, job_title: "Lead" } }
    assert_response :success
    assert employee.reload.active?
  end

  test "DELETE deactivates the employee (soft delete) and keeps the row" do
    employee = create_employee
    assert_no_difference "Employee.count" do
      delete "/api/v1/employees/#{employee.id}"
    end
    assert_response :success
    assert_equal false, json["data"]["active"]
    assert_not employee.reload.active?
  end

  test "deactivated employees disappear from the default list but stay findable" do
    employee = create_employee(full_name: "Gone Soon")
    delete "/api/v1/employees/#{employee.id}"
    get "/api/v1/employees"
    assert_empty json["data"]
    get "/api/v1/employees", params: { status: "inactive" }
    assert_equal ["Gone Soon"], json["data"].map { |e| e["full_name"] }
  end

  test "GET filter_options lists distinct values for the UI dropdowns, sorted" do
    create_employee(country: "Japan", currency: "JPY", department: "Sales", job_title: "Sales Manager")
    create_employee(country: "India", department: "Engineering", job_title: "Software Engineer")
    create_employee(country: "India", department: "Engineering", job_title: "Software Engineer").deactivate!
    get "/api/v1/employees/filter_options"
    assert_response :success
    assert_equal %w[India Japan], json["countries"]
    assert_equal %w[Engineering Sales], json["departments"]
    assert_equal ["Sales Manager", "Software Engineer"], json["job_titles"]
    assert_equal Employee::SENIORITIES, json["seniorities"]
    assert_equal Employee::CURRENCIES, json["currencies"]
  end
end
