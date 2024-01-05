SELECT *
FROM provision_log
WHERE log_message->'type' = '"outputs"';


select provision_log.log_message->'type' from provision_log where action = 'DESTROY' order by  timestamp

