import json
import logging

class JSONFormatter(logging.Formatter):
    def format(self, record):
        log_record = {
            'timestamp': self.formatTime(record, self.datefmt),
            'level': record.levelname,
            'logger': record.name,
            'message': record.getMessage(),
        }
        
        # Capture custom context flag/variables passed via `extra` parameter
        # e.g., logger.warning("msg", extra={'context': {...}})
        if hasattr(record, 'context'):
            log_record['context'] = record.context
        elif hasattr(record, 'extra_context'):
            log_record['context'] = record.extra_context
            
        # Format exception traceback if present
        if record.exc_info:
            log_record['exc_info'] = self.formatException(record.exc_info)
            
        return json.dumps(log_record)
