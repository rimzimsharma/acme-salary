module Seeding
  class EmployeeGenerator
    include Enumerable

    def initialize(count:, seed: 42, today: Date.current)
      @count = count
      @today = today
    end

    def each
      @count.times do |i|
        yield({
          full_name: "Employee #{i}", email: "employee#{i}@acme.test", job_title: "Software Engineer",
          department: "Engineering", country: "India", currency: "INR", annual_salary: 2_400_000,
          seniority: "mid", hire_date: @today, active: true
        })
      end
    end
  end
end
