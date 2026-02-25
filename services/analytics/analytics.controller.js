/**
 * Analytics Controller pour LionTrack
 * Exécute les requêtes de la Data Warehouse
 */

const { Client } = require('pg');
const csv = require('fast-csv');
const fs = require('fs');

// Configuration PostgreSQL
const pgConfig = {
  user: process.env.PG_USER || 'liontrack',
  password: process.env.PG_PASSWORD || 'liontrack_secure_pass',
  host: process.env.PG_HOST || 'postgres',
  port: process.env.PG_PORT || 5432,
  database: process.env.PG_DATABASE || 'liontrack_warehouse',
};

// ========== LIONS ANALYTICS ==========

exports.getLionsAnalytics = async (req, res) => {
  const client = new Client(pgConfig);
  
  try {
    await client.connect();
    
    const query = `
      SELECT 
        l.lion_id,
        l.name,
        l.status,
        l.data_quality_score,
        COALESCE(m.avg_weight, 0) as current_weight,
        COALESCE(m.health_score, 0) as health_score,
        COALESCE(m.tracking_frequency, 0) as tracking_frequency,
        l.position_lat,
        l.position_lng,
        l.updated_at
      FROM silver.lions l
      LEFT JOIN gold.lions_metrics m ON l.lion_id = m.lion_id 
        AND m.metric_date = CURRENT_DATE
      ORDER BY l.updated_at DESC
    `;
    
    const result = await client.query(query);
    
    res.json({
      count: result.rows.length,
      lions: result.rows,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ error: error.message });
  } finally {
    await client.end();
  }
};

exports.getLionDetailsAnalytics = async (req, res) => {
  const client = new Client(pgConfig);
  const { lionId } = req.params;
  
  try {
    await client.connect();
    
    const query = `
      SELECT 
        l.lion_id,
        l.name,
        l.status,
        l.position_lat,
        l.position_lng,
        m.avg_weight,
        m.weight_trend,
        m.health_score,
        m.tracking_frequency,
        m.metric_date
      FROM silver.lions l
      LEFT JOIN gold.lions_metrics m ON l.lion_id = m.lion_id
      WHERE l.lion_id = $1
      ORDER BY m.metric_date DESC
      LIMIT 30
    `;
    
    const result = await client.query(query, [lionId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Lion not found' });
    }
    
    res.json({
      lion: result.rows[0],
      history: result.rows
    });
    
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ error: error.message });
  } finally {
    await client.end();
  }
};

exports.getWeightTrend = async (req, res) => {
  const client = new Client(pgConfig);
  const { lionId } = req.params;
  const { days = 30 } = req.query;
  
  try {
    await client.connect();
    
    const query = `
      SELECT 
        w.lion_id,
        w.measured_at::date as date,
        ROUND(AVG(w.weight)::numeric, 2) as avg_weight,
        ROUND(MIN(w.weight)::numeric, 2) as min_weight,
        ROUND(MAX(w.weight)::numeric, 2) as max_weight,
        COUNT(*) as measurements_count
      FROM silver.weight_history w
      WHERE w.lion_id = $1
        AND w.measured_at >= NOW() - INTERVAL '1 day' * $2
      GROUP BY w.lion_id, w.measured_at::date
      ORDER BY date DESC
    `;
    
    const result = await client.query(query, [lionId, days]);
    
    res.json({
      lion_id: lionId,
      period_days: days,
      data: result.rows,
      count: result.rows.length
    });
    
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ error: error.message });
  } finally {
    await client.end();
  }
};

exports.getPositionHistory = async (req, res) => {
  const client = new Client(pgConfig);
  const { lionId } = req.params;
  const { hours = 24 } = req.query;
  
  try {
    await client.connect();
    
    const query = `
      SELECT 
        lion_id,
        position_date,
        lat,
        lng,
        accuracy
      FROM gold.lions_positions_history
      WHERE lion_id = $1
        AND position_date >= NOW() - INTERVAL '1 hour' * $2
      ORDER BY position_date DESC
      LIMIT 1000
    `;
    
    const result = await client.query(query, [lionId, hours]);
    
    res.json({
      lion_id: lionId,
      period_hours: hours,
      positions: result.rows,
      count: result.rows.length
    });
    
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ error: error.message });
  } finally {
    await client.end();
  }
};

exports.getLionsHealthReport = async (req, res) => {
  const client = new Client(pgConfig);
  
  try {
    await client.connect();
    
    const query = `
      SELECT 
        COUNT(*) FILTER (WHERE health_score > 80) as excellent_health,
        COUNT(*) FILTER (WHERE health_score BETWEEN 60 AND 80) as good_health,
        COUNT(*) FILTER (WHERE health_score < 60) as needs_attention,
        ROUND(AVG(health_score)::numeric, 2) as avg_health_score,
        ROUND(AVG(avg_weight)::numeric, 2) as avg_weight,
        COUNT(DISTINCT lion_id) as total_lions
      FROM gold.lions_metrics
      WHERE metric_date = CURRENT_DATE
    `;
    
    const result = await client.query(query);
    
    res.json({
      report_date: new Date().toISOString(),
      health_distribution: result.rows[0],
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ error: error.message });
  } finally {
    await client.end();
  }
};

// ========== USERS ANALYTICS ==========

exports.getUserEngagementScore = async (req, res) => {
  const client = new Client(pgConfig);
  const { userId } = req.params;
  
  try {
    await client.connect();
    
    const query = `
      SELECT 
        user_id,
        activity_date,
        challenges_completed,
        challenges_in_progress,
        COALESCE(weight_entries, 0) as weight_entries,
        ROUND(engagement_score::numeric, 2) as engagement_score
      FROM gold.users_activity
      WHERE user_id = $1
      ORDER BY activity_date DESC
      LIMIT 30
    `;
    
    const result = await client.query(query, [userId]);
    
    const latestScore = result.rows[0]?.engagement_score || 0;
    
    res.json({
      user_id: userId,
      current_score: latestScore,
      history: result.rows
    });
    
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ error: error.message });
  } finally {
    await client.end();
  }
};

exports.getUserActivitySummary = async (req, res) => {
  const client = new Client(pgConfig);
  const { userId } = req.params;
  
  try {
    await client.connect();
    
    const query = `
      SELECT 
        SUM(challenges_completed) as total_completed,
        SUM(challenges_in_progress) as total_in_progress,
        SUM(weight_entries) as total_weight_entries,
        AVG(engagement_score) as avg_engagement,
        COUNT(DISTINCT activity_date) as active_days
      FROM gold.users_activity
      WHERE user_id = $1
        AND activity_date >= CURRENT_DATE - INTERVAL '30 days'
    `;
    
    const result = await client.query(query, [userId]);
    
    res.json({
      user_id: userId,
      period: '30_days',
      summary: result.rows[0],
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ error: error.message });
  } finally {
    await client.end();
  }
};

exports.getChallengesAnalytics = async (req, res) => {
  const client = new Client(pgConfig);
  const { userId } = req.params;
  
  try {
    await client.connect();
    
    const query = `
      SELECT 
        challenge_id,
        title,
        status,
        EXTRACT(DAY FROM (now() - created_at)) as age_days,
        created_at,
        updated_at
      FROM silver.challenges
      WHERE user_id = $1
      ORDER BY updated_at DESC
    `;
    
    const result = await client.query(query, [userId]);
    
    const stats = {
      total: result.rows.length,
      completed: result.rows.filter(c => c.status === 'completed').length,
      in_progress: result.rows.filter(c => c.status === 'in_progress').length,
      abandoned: result.rows.filter(c => c.status === 'abandoned').length,
    };
    
    res.json({
      user_id: userId,
      stats,
      challenges: result.rows
    });
    
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ error: error.message });
  } finally {
    await client.end();
  }
};

// ========== GLOBAL ANALYTICS ==========

exports.getDashboard = async (req, res) => {
  const client = new Client(pgConfig);
  
  try {
    await client.connect();
    
    // Paralléliser les requêtes
    const [lionsResult, usersResult, qualityResult] = await Promise.all([
      client.query('SELECT COUNT(*) as count FROM silver.lions;'),
      client.query('SELECT COUNT(DISTINCT user_id) as count FROM silver.users;'),
      client.query(`
        SELECT 
          ROUND(AVG(quality_percentage)::numeric, 2) as avg_quality
        FROM metadata.data_quality_checks
        WHERE check_timestamp >= NOW() - INTERVAL '7 days'
      `)
    ]);
    
    res.json({
      dashboard: {
        total_lions: parseInt(lionsResult.rows[0].count),
        total_users: parseInt(usersResult.rows[0].count),
        data_quality_score: qualityResult.rows[0]?.avg_quality || 0,
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ error: error.message });
  } finally {
    await client.end();
  }
};

exports.getSystemHealth = async (req, res) => {
  const client = new Client(pgConfig);
  
  try {
    await client.connect();
    
    const query = `
      SELECT 
        COUNT(*) FILTER (WHERE check_timestamp >= NOW() - INTERVAL '1 hour') as checks_last_hour,
        AVG(quality_percentage) FILTER (WHERE check_timestamp >= NOW() - INTERVAL '1 hour') as avg_quality,
        COUNT(DISTINCT status) as unique_statuses,
        MAX(check_timestamp) as last_check
      FROM metadata.data_quality_checks
    `;
    
    const result = await client.query(query);
    
    res.json({
      health: result.rows[0],
      status: result.rows[0]?.avg_quality > 80 ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ error: error.message });
  } finally {
    await client.end();
  }
};

exports.getDataQualityMetrics = async (req, res) => {
  const client = new Client(pgConfig);
  
  try {
    await client.connect();
    
    const query = `
      SELECT 
        table_name,
        COUNT(*) as checks_count,
        ROUND(AVG(quality_percentage)::numeric, 2) as avg_quality,
        ROUND(MIN(quality_percentage)::numeric, 2) as min_quality,
        MAX(check_timestamp) as last_check
      FROM metadata.data_quality_checks
      WHERE check_timestamp >= NOW() - INTERVAL '7 days'
      GROUP BY table_name
      ORDER BY avg_quality DESC
    `;
    
    const result = await client.query(query);
    
    res.json({
      data_quality: result.rows,
      period: '7_days',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ error: error.message });
  } finally {
    await client.end();
  }
};

// ========== LEADERBOARDS ==========

exports.getUsersLeaderboard = async (req, res) => {
  const client = new Client(pgConfig);
  const { limit = 10 } = req.query;
  
  try {
    await client.connect();
    
    const query = `
      SELECT 
        u.user_id,
        u.username,
        SUM(a.challenges_completed) as total_completed,
        AVG(a.engagement_score) as avg_engagement,
        COUNT(DISTINCT a.activity_date) as active_days
      FROM silver.users u
      LEFT JOIN gold.users_activity a ON u.user_id = a.user_id
        AND a.activity_date >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY u.user_id, u.username
      ORDER BY total_completed DESC, avg_engagement DESC
      LIMIT $1
    `;
    
    const result = await client.query(query, [limit]);
    
    res.json({
      leaderboard: result.rows.map((row, idx) => ({
        rank: idx + 1,
        ...row
      })),
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ error: error.message });
  } finally {
    await client.end();
  }
};

exports.getLionsLeaderboard = async (req, res) => {
  const client = new Client(pgConfig);
  const { limit = 10 } = req.query;
  
  try {
    await client.connect();
    
    const query = `
      SELECT 
        l.lion_id,
        l.name,
        ROUND(AVG(m.health_score)::numeric, 2) as avg_health,
        COUNT(m.metric_date) as tracked_days,
        MAX(m.tracking_frequency) as max_frequency
      FROM silver.lions l
      LEFT JOIN gold.lions_metrics m ON l.lion_id = m.lion_id
      GROUP BY l.lion_id, l.name
      ORDER BY avg_health DESC
      LIMIT $1
    `;
    
    const result = await client.query(query, [limit]);
    
    res.json({
      leaderboard: result.rows.map((row, idx) => ({
        rank: idx + 1,
        ...row
      })),
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ error: error.message });
  } finally {
    await client.end();
  }
};

// ========== TRENDS ==========

exports.getWeightTrends = async (req, res) => {
  const client = new Client(pgConfig);
  
  try {
    await client.connect();
    
    const query = `
      SELECT 
        'lions' as entity_type,
        ROUND(AVG(avg_weight)::numeric, 2) as avg_value,
        metric_date
      FROM gold.lions_metrics
      WHERE metric_date >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY metric_date
      ORDER BY metric_date DESC
    `;
    
    const result = await client.query(query);
    
    res.json({
      trend: 'weight_30days',
      data: result.rows,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ error: error.message });
  } finally {
    await client.end();
  }
};

exports.getEngagementTrends = async (req, res) => {
  const client = new Client(pgConfig);
  
  try {
    await client.connect();
    
    const query = `
      SELECT 
        activity_date,
        COUNT(DISTINCT user_id) as active_users,
        ROUND(AVG(engagement_score)::numeric, 2) as avg_engagement
      FROM gold.users_activity
      WHERE activity_date >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY activity_date
      ORDER BY activity_date DESC
    `;
    
    const result = await client.query(query);
    
    res.json({
      trend: 'user_engagement_30days',
      data: result.rows,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ error: error.message });
  } finally {
    await client.end();
  }
};

// ========== EXPORT ==========

exports.exportAsCSV = async (req, res) => {
  const client = new Client(pgConfig);
  const { table = 'silver.lions' } = req.query;
  
  try {
    await client.connect();
    
    const result = await client.query(`SELECT * FROM ${table} LIMIT 10000`);
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="liontrack_${table.replace('.', '_')}_${Date.now()}.csv"`);
    
    const csvStream = csv.format({ headers: true });
    csvStream.pipe(res);
    
    result.rows.forEach(row => csvStream.write(row));
    csvStream.end();
    
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ error: error.message });
  } finally {
    await client.end();
  }
};

exports.exportAsJSON = async (req, res) => {
  const client = new Client(pgConfig);
  const { table = 'silver.lions' } = req.query;
  
  try {
    await client.connect();
    
    const result = await client.query(`SELECT * FROM ${table} LIMIT 10000`);
    
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="liontrack_${table.replace('.', '_')}_${Date.now()}.json"`);
    
    res.json({
      table,
      record_count: result.rows.length,
      export_timestamp: new Date().toISOString(),
      data: result.rows
    });
    
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ error: error.message });
  } finally {
    await client.end();
  }
};
