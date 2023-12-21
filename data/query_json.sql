SELECT *
FROM provision_log
WHERE log_message->'type' = '"outputs"';
