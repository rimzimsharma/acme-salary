require "test_helper"

# A missing database path only shows up in production (every API call returns 500 while the
# health check still passes), so it is pinned here.
class DatabaseConfigTest < ActiveSupport::TestCase
  def config_for(environment)
    yaml = ERB.new(Rails.root.join("config/database.yml").read).result
    YAML.safe_load(yaml, aliases: true).fetch(environment)
  end

  %w[development test production].each do |environment|
    test "#{environment} names a SQLite database file" do
      assert config_for(environment)["database"].present?, "#{environment} has no database path"
    end
  end

  test "production database path can be overridden for hosts with a persistent disk" do
    ENV["DATABASE_PATH"] = "/data/salary.sqlite3"
    assert_equal "/data/salary.sqlite3", config_for("production")["database"]
  ensure
    ENV.delete("DATABASE_PATH")
  end
end
