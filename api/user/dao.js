const _ = require('lodash');
const dao = require('postgres-gen-dao');
const badgeDescriptions = require('../../utils').badgeDescriptions;

const userQuery = 'select @m_user.id, @m_user.name, @m_user.title, @agency.*, @tags.* ' +
  'from @midas_user m_user ' +
  'left join tagentity_users__user_tags user_tags on user_tags.user_tags = m_user.id ' +
  'left join @tagentity tags on tags.id = user_tags.tagentity_users ' +
  'left join @agency on agency.agency_id = m_user.agency_id ' +
  'where disabled = false and hiring_path = \'fed\'';

const tagQuery = 'select tags.* ' +
  'from tagentity tags ' +
  'inner join tagentity_users__user_tags user_tags on tags.id = user_tags.tagentity_users ' +
  'where user_tags.user_tags = ?';

const userAgencyQuery = 'select tagentity.name, midas_user."isAdmin" ' +
  'from midas_user inner join tagentity_users__user_tags on midas_user.id = tagentity_users__user_tags.user_tags ' +
  'inner join tagentity tagentity on tagentity.id = tagentity_users__user_tags.tagentity_users ' +
  'where midas_user.id = ? ' +
  "and tagentity.type = 'agency' ";

const taskParticipatedQuery = 'select task.*, volunteer.assigned, volunteer."taskComplete" ' +
  'from task inner join volunteer on task.id = volunteer."taskId" ' +
  'where volunteer."userId" = ?';

const deleteUserTags = 'delete from tagentity_users__user_tags where id in (' +
  'select tagentity_users__user_tags.id ' +
  'from tagentity_users__user_tags ' +
  'join tagentity on tagentity.id = tagentity_users and type not in (\'skill\', \'topic\') ' +
  'where user_tags = ?)';

const deleteSkillTags = 'delete from tagentity_users__user_tags where id in (' +
  'select tagentity_users__user_tags.id ' +
  'from tagentity_users__user_tags ' +
  'join tagentity on tagentity.id = tagentity_users and type in (\'skill\', \'topic\') ' +
  'where user_tags = ?)';

const applicationStatusQuery = 'SELECT app.application_id AS "id", app.submitted_at AS "submittedAt", ' +
  'comm.community_name AS "communityName", c.name AS "cycleName", c.apply_end_date AS "applyEndDate", ' +
  'app.updated_at AS "updatedAt" ' +
  'FROM application app ' +
  'INNER JOIN community comm ON app.community_id = comm.community_id ' +
  'INNER JOIN cycle c ON app.cycle_id = c.cycle_id ' +
  'WHERE app.user_id = ? ';

const options = {
  user: {
    fetch: {
      tags: [],
      agency: '',
    },
    exclude: {
      tags: [ 'deletedAt', 'createdAt', 'updatedAt', 'data' ],
    },
  },
};

const clean = {
  users: function (records) {
    return records.map(function (record) {
      var cleaned = _.pickBy(record, _.identity);
      cleaned.tags = (cleaned.tags || []).map(function (tag) {
        return _.pickBy(tag, _.identity);
      });
      return cleaned;
    });
  },
  profile: function (record) {
    var cleaned = _.pickBy(record, _.identity);
    cleaned.badges = (cleaned.badges || []).map(function (badge) {
      return _.pickBy(badge, _.identity);
    });
    cleaned.tags = (cleaned.tags || []).map(function (tag) {
      return _.pickBy(tag, _.identity);
    });
    return cleaned;
  },
  activity: function (records) {
    return records.map(function (record) {
      var cleaned = _.pickBy(record, _.identity);
      cleaned.owner = cleaned.userId;
      return cleaned;
    });
  },
  badge: function (records) {
    return records.map(function (record) {
      var cleaned = _.pickBy(record, _.identity);
      cleaned.description = badgeDescriptions[record.type];
      return cleaned;
    });
  },
};

module.exports = function (db) {
  return {
    Agency: dao({ db: db, table: 'agency' }),
    AuditLog: dao({ db: db, table: 'audit_log'}),
    User: dao({ db: db, table: 'midas_user' }),
    TagEntity: dao({ db: db, table: 'tagentity' }),
    UserTags: dao({ db: db, table: 'tagentity_users__user_tags' }),
    Badge: dao({ db: db, table: 'badge'}),
    Task: dao({ db: db, table: 'task' }),
    Passport: dao({ db: db, table: 'passport' }),
    Application: dao({ db: db, table: 'application' }),
    query: {
      user: userQuery,
      tag: tagQuery,
      participated: taskParticipatedQuery,
      userAgencyQuery: userAgencyQuery,
      deleteUserTags: deleteUserTags,
      deleteSkillTags: deleteSkillTags,
      applicationStatus: applicationStatusQuery,
    },
    options: options,
    clean: clean,
  };
};
