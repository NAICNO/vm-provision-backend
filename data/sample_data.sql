-- Insert sample data into user_profile
INSERT INTO user_profile (email, username, password, first_name, last_name, user_type)
VALUES
    ('john.doe@example.com', 'john_doe', 'password123', 'John', 'Doe', 'Admin'),
    ('jane.doe@example.com', 'jane_doe', 'password123', 'Jane', 'Doe', 'User');

-- Insert sample data into vm_template
INSERT INTO vm_template (template_name, cpu, ram, storage, os)
VALUES
    ('Basic', 2, 2048, 50, 'Linux'),
    ('Pro', 4, 4096, 100, 'Windows');

-- Insert sample data into virtual_machine
INSERT INTO virtual_machine (user_id, template_id, vm_name, ipv4_address, ipv6_address, status)
VALUES
    ((SELECT user_id FROM user_profile WHERE username = 'john_doe'), (SELECT template_id FROM vm_template WHERE template_name = 'Basic'), 'VM1', '192.168.1.10', '::1', 'Running'),
    ((SELECT user_id FROM user_profile WHERE username = 'jane_doe'), (SELECT template_id FROM vm_template WHERE template_name = 'Pro'), 'VM2', '192.168.1.11', '::1', 'Stopped');

-- Insert sample data into vm_event
INSERT INTO vm_event (vm_id, event_type, description)
VALUES
    ((SELECT vm_id FROM virtual_machine WHERE vm_name = 'VM1'), 'Start', 'VM started'),
    ((SELECT vm_id FROM virtual_machine WHERE vm_name = 'VM2'), 'Stop', 'VM stopped');

-- Insert sample data into user_activity
INSERT INTO user_activity (user_id, vm_id, activity_type, description)
VALUES
    ((SELECT user_id FROM user_profile WHERE username = 'john_doe'), (SELECT vm_id FROM virtual_machine WHERE vm_name = 'VM1'), 'Login', 'User logged in'),
    ((SELECT user_id FROM user_profile WHERE username = 'jane_doe'), (SELECT vm_id FROM virtual_machine WHERE vm_name = 'VM2'), 'Logout', 'User logged out');
