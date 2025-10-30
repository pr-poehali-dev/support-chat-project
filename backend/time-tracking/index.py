'''
Business: API для отслеживания рабочего времени операторов по статусам
Args: event - dict с httpMethod, body, queryStringParameters
      context - объект с атрибутами request_id, function_name
Returns: HTTP response dict с данными времени работы
'''
import json
import os
import psycopg2
from typing import Dict, Any
from datetime import datetime, date

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    try:
        conn = psycopg2.connect(os.environ['DATABASE_URL'])
        cur = conn.cursor()
        
        if method == 'GET':
            params = event.get('queryStringParameters', {})
            staff_id = params.get('staff_id')
            start_date = params.get('start_date')
            end_date = params.get('end_date')
            
            if staff_id and start_date and end_date:
                cur.execute(
                    '''SELECT date, status, 
                       SUM(duration_minutes) as total_minutes
                       FROM time_tracking
                       WHERE staff_id = %s 
                       AND date >= %s AND date <= %s
                       AND ended_at IS NOT NULL
                       GROUP BY date, status
                       ORDER BY date DESC, status''',
                    (staff_id, start_date, end_date)
                )
                rows = cur.fetchall()
                result = [{
                    'date': row[0].isoformat() if row[0] else None,
                    'status': row[1],
                    'total_minutes': row[2] or 0
                } for row in rows]
            elif staff_id:
                cur.execute(
                    '''SELECT date, status, 
                       SUM(duration_minutes) as total_minutes
                       FROM time_tracking
                       WHERE staff_id = %s
                       AND date = CURRENT_DATE
                       AND ended_at IS NOT NULL
                       GROUP BY date, status
                       ORDER BY status''',
                    (staff_id,)
                )
                rows = cur.fetchall()
                result = [{
                    'date': row[0].isoformat() if row[0] else None,
                    'status': row[1],
                    'total_minutes': row[2] or 0
                } for row in rows]
            else:
                result = {'error': 'Missing staff_id parameter'}
            
            cur.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps(result, ensure_ascii=False),
                'isBase64Encoded': False
            }
        
        elif method == 'POST':
            body = json.loads(event.get('body', '{}'))
            staff_id = body.get('staff_id')
            new_status = body.get('status')
            
            if not all([staff_id, new_status]):
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Missing required fields'}, ensure_ascii=False),
                    'isBase64Encoded': False
                }
            
            cur.execute(
                '''SELECT id FROM time_tracking 
                   WHERE staff_id = %s AND ended_at IS NULL
                   ORDER BY started_at DESC LIMIT 1''',
                (staff_id,)
            )
            current_session = cur.fetchone()
            
            if current_session:
                cur.execute(
                    '''UPDATE time_tracking 
                       SET ended_at = CURRENT_TIMESTAMP,
                           duration_minutes = EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - started_at)) / 60
                       WHERE id = %s''',
                    (current_session[0],)
                )
            
            cur.execute(
                '''INSERT INTO time_tracking (staff_id, status, date)
                   VALUES (%s, %s, CURRENT_DATE)
                   RETURNING id''',
                (staff_id, new_status)
            )
            new_id = cur.fetchone()[0]
            
            conn.commit()
            cur.close()
            conn.close()
            
            return {
                'statusCode': 201,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'id': new_id, 'message': 'Time tracking updated'}, ensure_ascii=False),
                'isBase64Encoded': False
            }
        
        else:
            return {
                'statusCode': 405,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Method not allowed'}, ensure_ascii=False),
                'isBase64Encoded': False
            }
    
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)}, ensure_ascii=False),
            'isBase64Encoded': False
        }
