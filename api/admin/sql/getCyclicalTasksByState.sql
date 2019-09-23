with tasks as (
	select
		task.*, cycle.apply_start_date,
		(
			select row_to_json (muser)
			from (
					select
						id, name, username, government_uri,
						coalesce(given_name, (string_to_array(trim(name), ' '))[array_lower(string_to_array(trim(name), ' '), 1)]) as given_name,
						coalesce(last_name, (string_to_array(trim(name), ' '))[array_upper(string_to_array(trim(name), ' '), 1)]) as last_name
					from midas_user where task."userId" = midas_user.id
				) muser
		) as owner,
		(
			select json_agg (users)
			from (
				select midas_user.id, midas_user.name, midas_user.given_name, midas_user.last_name, midas_user.username, midas_user.government_uri
				from application_task
				join application on application_task.application_id = application.application_id
				join midas_user on application.user_id = midas_user.id
				where application_task.task_id = task.id
			) users
		) as applicants
	from task
	left join cycle on task.cycle_id = cycle.cycle_id
)
select * from tasks
where [where clause]
order by [order by]
limit 25 offset ((? - 1) * 25);