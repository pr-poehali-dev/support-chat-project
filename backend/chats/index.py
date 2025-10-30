'''
Business: API для управления чатами - получение, создание, обновление с поддержкой таймеров, эскалации и сохранения клиентов
Args: event - dict с httpMethod, body, queryStringParameters
      context - объект с атрибутами request_id, function_name
Returns: HTTP response dict с данными чатов
'''
import json
import os
import psycopg2
from datetime import datetime, timedelta
from typing import Dict, Any

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id, X-Auth-Token, X-Session-Id',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    try:
        conn = psycopg2.connect(os.environ['DATABASE_URL'])
        cur = conn.cursor()
        
        if method == 'GET':
            params = event.get('queryStringParameters', {}) or {}
            status = params.get('status', 'active')
            operator_id = params.get('operator_id')
            chat_id = params.get('id')
            session_id = params.get('session_id')
            
            # Для портала QC - чаты со статусом 'qc'
            if status == 'qc':
                cur.execute(
                    '''SELECT c.id, c.client_name, c.client_phone, c.operator_id, 
                       s.name as operator_name, c.status, c.created_at, c.closed_at,
                       c.resolution, c.resolution_comment, c.handling_time,
                       c.qc_status, COUNT(m.id) as message_count
                       FROM t_p77168343_support_chat_project.chats c
                       LEFT JOIN t_p77168343_support_chat_project.staff s ON c.operator_id = s.id
                       LEFT JOIN t_p77168343_support_chat_project.messages m ON c.id = m.chat_id
                       WHERE c.status = 'qc'
                       GROUP BY c.id, s.name
                       ORDER BY c.created_at DESC'''
                )
                rows = cur.fetchall()
                result = [{
                    'id': row[0],
                    'client_name': row[1],
                    'client_phone': row[2],
                    'operator_id': row[3],
                    'operator_name': row[4],
                    'status': row[5],
                    'created_at': row[6].isoformat() if row[6] else None,
                    'closed_at': row[7].isoformat() if row[7] else None,
                    'resolution': row[8],
                    'resolution_comment': row[9],
                    'handling_time': row[10],
                    'qc_status': row[11],
                    'message_count': row[12]
                } for row in rows]
            
            # Поиск по session_id (для восстановления чата клиента)
            elif session_id:
                cur.execute(
                    '''SELECT c.id, c.client_name, c.client_phone, c.operator_id, 
                       s.name as operator_name, c.status, c.created_at, c.timer_expires_at,
                       COUNT(m.id) as message_count
                       FROM t_p77168343_support_chat_project.chats c
                       LEFT JOIN t_p77168343_support_chat_project.staff s ON c.operator_id = s.id
                       LEFT JOIN t_p77168343_support_chat_project.messages m ON c.id = m.chat_id
                       WHERE c.session_id = %s AND c.status = 'active'
                       GROUP BY c.id, s.name''',
                    (session_id,)
                )
                row = cur.fetchone()
                result = {
                    'id': row[0],
                    'client_name': row[1],
                    'client_phone': row[2],
                    'operator_id': row[3],
                    'operator_name': row[4],
                    'status': row[5],
                    'created_at': row[6].isoformat() if row[6] else None,
                    'timer_expires_at': row[7].isoformat() if row[7] else None,
                    'message_count': row[8]
                } if row else None
            
            # Получение одного чата по ID
            elif chat_id:
                cur.execute(
                    '''SELECT c.id, c.client_name, c.client_phone, c.operator_id, 
                       s.name as operator_name, c.status, c.created_at, c.closed_at,
                       c.timer_expires_at, c.session_id
                       FROM t_p77168343_support_chat_project.chats c
                       LEFT JOIN t_p77168343_support_chat_project.staff s ON c.operator_id = s.id
                       WHERE c.id = %s''',
                    (chat_id,)
                )
                row = cur.fetchone()
                
                result = {
                    'id': row[0],
                    'client_name': row[1],
                    'client_phone': row[2],
                    'operator_id': row[3],
                    'operator_name': row[4],
                    'status': row[5],
                    'created_at': row[6].isoformat() if row[6] else None,
                    'closed_at': row[7].isoformat() if row[7] else None,
                    'timer_expires_at': row[8].isoformat() if row[8] else None,
                    'session_id': row[9]
                } if row else None
            
            # Список чатов (активные/закрытые) для оператора
            else:
                query = '''SELECT c.id, c.client_name, c.client_phone, c.operator_id, 
                           s.name as operator_name, c.status, c.created_at, c.closed_at,
                           c.timer_expires_at, c.resolution, c.scheduled_for,
                           COUNT(m.id) as message_count
                           FROM t_p77168343_support_chat_project.chats c
                           LEFT JOIN t_p77168343_support_chat_project.staff s ON c.operator_id = s.id
                           LEFT JOIN t_p77168343_support_chat_project.messages m ON c.id = m.chat_id
                           WHERE c.status = %s'''
                
                query_params = [status]
                
                # Фильтр по оператору
                if operator_id:
                    query += ' AND c.operator_id = %s'
                    query_params.append(int(operator_id))
                
                query += ' GROUP BY c.id, s.name ORDER BY c.created_at DESC'
                
                cur.execute(query, tuple(query_params))
                rows = cur.fetchall()
                result = [{
                    'id': row[0],
                    'client_name': row[1],
                    'client_phone': row[2],
                    'operator_id': row[3],
                    'operator_name': row[4],
                    'status': row[5],
                    'created_at': row[6].isoformat() if row[6] else None,
                    'closed_at': row[7].isoformat() if row[7] else None,
                    'timer_expires_at': row[8].isoformat() if row[8] else None,
                    'resolution': row[9],
                    'scheduled_for': row[10].isoformat() if row[10] else None,
                    'message_count': row[11]
                } for row in rows]
            
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
            client_name = body.get('client_name')
            client_phone = body.get('client_phone')
            session_id = body.get('session_id')
            message_text = body.get('message')
            
            if not all([client_name, message_text]):
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Missing required fields'}, ensure_ascii=False),
                    'isBase64Encoded': False
                }
            
            # Найти свободного оператора на линии (автоназначение)
            cur.execute(
                '''SELECT id FROM t_p77168343_support_chat_project.staff 
                   WHERE on_line = true 
                   ORDER BY RANDOM() 
                   LIMIT 1'''
            )
            operator_row = cur.fetchone()
            operator_id = operator_row[0] if operator_row else None
            
            # Создать или найти клиента
            cur.execute(
                '''INSERT INTO t_p77168343_support_chat_project.clients (phone, name, session_id)
                   VALUES (%s, %s, %s)
                   ON CONFLICT (phone) DO UPDATE SET 
                   name = EXCLUDED.name,
                   session_id = EXCLUDED.session_id,
                   last_interaction = CURRENT_TIMESTAMP
                   RETURNING id''',
                (client_phone, client_name, session_id)
            )
            client_id = cur.fetchone()[0]
            
            # Создать чат с таймером 15 минут
            timer_expires = datetime.now() + timedelta(minutes=15)
            cur.execute(
                '''INSERT INTO t_p77168343_support_chat_project.chats 
                   (client_name, client_phone, client_id, operator_id, session_id, 
                    timer_expires_at, started_at, status)
                   VALUES (%s, %s, %s, %s, %s, %s, CURRENT_TIMESTAMP, 'active') 
                   RETURNING id''',
                (client_name, client_phone, client_id, operator_id, session_id, timer_expires)
            )
            chat_id = cur.fetchone()[0]
            
            # Сохранить первое сообщение
            cur.execute(
                '''INSERT INTO t_p77168343_support_chat_project.messages 
                   (chat_id, sender_type, sender_name, content, created_at)
                   VALUES (%s, 'client', %s, %s, CURRENT_TIMESTAMP)''',
                (chat_id, client_name, message_text)
            )
            
            conn.commit()
            cur.close()
            conn.close()
            
            return {
                'statusCode': 201,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({
                    'id': chat_id, 
                    'message': 'Chat created',
                    'operator_id': operator_id,
                    'session_id': session_id
                }, ensure_ascii=False),
                'isBase64Encoded': False
            }
        
        elif method == 'PUT':
            body = json.loads(event.get('body', '{}'))
            chat_id = body.get('id')
            
            if not chat_id:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Missing chat id'}, ensure_ascii=False),
                    'isBase64Encoded': False
                }
            
            # Продление таймера на 15 минут
            if body.get('extend_timer'):
                new_expires = datetime.now() + timedelta(minutes=15)
                cur.execute(
                    '''UPDATE t_p77168343_support_chat_project.chats 
                       SET timer_expires_at = %s, timer_extended = timer_extended + 1
                       WHERE id = %s
                       RETURNING id, timer_expires_at''',
                    (new_expires, chat_id)
                )
                row = cur.fetchone()
                conn.commit()
                cur.close()
                conn.close()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({
                        'id': row[0],
                        'timer_expires_at': row[1].isoformat()
                    }, ensure_ascii=False),
                    'isBase64Encoded': False
                }
            
            # Передача другому оператору
            if body.get('transfer_to_next'):
                cur.execute(
                    '''SELECT id FROM t_p77168343_support_chat_project.staff 
                       WHERE on_line = true AND id != (SELECT operator_id FROM t_p77168343_support_chat_project.chats WHERE id = %s)
                       ORDER BY RANDOM() 
                       LIMIT 1''',
                    (chat_id,)
                )
                next_op = cur.fetchone()
                
                if next_op:
                    new_expires = datetime.now() + timedelta(minutes=15)
                    cur.execute(
                        '''UPDATE t_p77168343_support_chat_project.chats 
                           SET operator_id = %s, timer_expires_at = %s
                           WHERE id = %s''',
                        (next_op[0], new_expires, chat_id)
                    )
                    conn.commit()
                    cur.close()
                    conn.close()
                    
                    return {
                        'statusCode': 200,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'message': 'Chat transferred'}, ensure_ascii=False),
                        'isBase64Encoded': False
                    }
                else:
                    cur.close()
                    conn.close()
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'No available operators'}, ensure_ascii=False),
                        'isBase64Encoded': False
                    }
            
            # Эскалация чата (новая резолюция)
            if body.get('resolution') == 'escalated':
                escalate_to = body.get('escalate_to_operator_id')
                if not escalate_to:
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'escalate_to_operator_id required'}, ensure_ascii=False),
                        'isBase64Encoded': False
                    }
                
                # Получить время начала для расчета handling_time
                cur.execute('SELECT started_at FROM t_p77168343_support_chat_project.chats WHERE id = %s', (chat_id,))
                started_row = cur.fetchone()
                started_at = started_row[0] if started_row else datetime.now()
                handling_seconds = int((datetime.now() - started_at).total_seconds())
                
                new_expires = datetime.now() + timedelta(minutes=15)
                cur.execute(
                    '''UPDATE t_p77168343_support_chat_project.chats 
                       SET operator_id = %s, 
                           status = 'active',
                           resolution = 'escalated',
                           resolution_comment = %s,
                           handling_time = %s,
                           timer_expires_at = %s
                       WHERE id = %s''',
                    (escalate_to, body.get('resolution_comment', ''), handling_seconds, new_expires, chat_id)
                )
                conn.commit()
                
                # Статистика для оператора
                cur.execute(
                    '''INSERT INTO t_p77168343_support_chat_project.operator_chat_stats 
                       (operator_id, date, total_chats, escalated)
                       VALUES ((SELECT operator_id FROM t_p77168343_support_chat_project.chats WHERE id = %s), CURRENT_DATE, 1, 1)
                       ON CONFLICT (operator_id, date) 
                       DO UPDATE SET escalated = t_p77168343_support_chat_project.operator_chat_stats.escalated + 1,
                                     total_chats = t_p77168343_support_chat_project.operator_chat_stats.total_chats + 1''',
                    (chat_id,)
                )
                conn.commit()
                cur.close()
                conn.close()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'message': 'Chat escalated'}, ensure_ascii=False),
                    'isBase64Encoded': False
                }
            
            # Закрытие чата с резолюцией (resolved/postponed)
            if 'status' in body and body['status'] == 'closed':
                resolution = body.get('resolution', 'resolved')
                resolution_comment = body.get('resolution_comment', '')
                scheduled_for = body.get('scheduled_for')
                
                # Получить время начала для расчета handling_time
                cur.execute('SELECT started_at FROM t_p77168343_support_chat_project.chats WHERE id = %s', (chat_id,))
                started_row = cur.fetchone()
                started_at = started_row[0] if started_row else datetime.now()
                handling_seconds = int((datetime.now() - started_at).total_seconds())
                
                # Определить финальный статус
                final_status = 'qc' if resolution == 'resolved' else 'closed'
                
                cur.execute(
                    '''UPDATE t_p77168343_support_chat_project.chats 
                       SET status = %s, 
                           closed_at = CURRENT_TIMESTAMP,
                           resolution = %s,
                           resolution_comment = %s,
                           scheduled_for = %s,
                           handling_time = %s
                       WHERE id = %s''',
                    (final_status, resolution, resolution_comment, scheduled_for, handling_seconds, chat_id)
                )
                conn.commit()
                
                # Обновить статистику оператора
                cur.execute(
                    '''INSERT INTO t_p77168343_support_chat_project.operator_chat_stats 
                       (operator_id, date, total_chats, resolved, postponed, avg_handling_time)
                       VALUES ((SELECT operator_id FROM t_p77168343_support_chat_project.chats WHERE id = %s), 
                               CURRENT_DATE, 1, %s, %s, %s)
                       ON CONFLICT (operator_id, date) 
                       DO UPDATE SET 
                       total_chats = t_p77168343_support_chat_project.operator_chat_stats.total_chats + 1,
                       resolved = t_p77168343_support_chat_project.operator_chat_stats.resolved + %s,
                       postponed = t_p77168343_support_chat_project.operator_chat_stats.postponed + %s,
                       avg_handling_time = (t_p77168343_support_chat_project.operator_chat_stats.avg_handling_time * 
                                           t_p77168343_support_chat_project.operator_chat_stats.total_chats + %s) / 
                                           (t_p77168343_support_chat_project.operator_chat_stats.total_chats + 1)''',
                    (chat_id, 
                     1 if resolution == 'resolved' else 0,
                     1 if resolution == 'postponed' else 0,
                     handling_seconds,
                     1 if resolution == 'resolved' else 0,
                     1 if resolution == 'postponed' else 0,
                     handling_seconds)
                )
                conn.commit()
                cur.close()
                conn.close()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'message': 'Chat closed', 'status': final_status}, ensure_ascii=False),
                    'isBase64Encoded': False
                }
            
            # Обработка QC (смена статуса с 'qc' на 'processing_qc' или 'closed')
            if 'qc_status' in body:
                qc_status = body['qc_status']
                if qc_status == 'closed':
                    cur.execute(
                        '''UPDATE t_p77168343_support_chat_project.chats 
                           SET qc_status = %s, status = 'closed' 
                           WHERE id = %s''',
                        (qc_status, chat_id)
                    )
                else:
                    cur.execute(
                        'UPDATE t_p77168343_support_chat_project.chats SET qc_status = %s WHERE id = %s',
                        (qc_status, chat_id)
                    )
                conn.commit()
                cur.close()
                conn.close()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'message': 'QC status updated'}, ensure_ascii=False),
                    'isBase64Encoded': False
                }
            
            # Обычное обновление (оператор, статус)
            update_fields = []
            params = []
            
            if 'operator_id' in body:
                update_fields.append("operator_id = %s")
                params.append(body['operator_id'])
            
            if 'status' in body:
                update_fields.append("status = %s")
                params.append(body['status'])
            
            if update_fields:
                params.append(chat_id)
                query = f"UPDATE t_p77168343_support_chat_project.chats SET {', '.join(update_fields)} WHERE id = %s"
                cur.execute(query, tuple(params))
                conn.commit()
            
            cur.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'message': 'Chat updated'}, ensure_ascii=False),
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