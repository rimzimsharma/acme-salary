class EmployeeSerializer
  def self.call(employee)
    {
      id: employee.id, full_name: employee.full_name, email: employee.email,
      job_title: employee.job_title, department: employee.department, country: employee.country,
      currency: employee.currency, annual_salary: employee.annual_salary,
      annual_salary_usd: CurrencyRates.to_usd(employee.annual_salary, employee.currency),
      seniority: employee.seniority, hire_date: employee.hire_date, active: employee.active
    }
  end
end
