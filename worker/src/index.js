import pino from 'pino';
import { createClient } from '@supabase/supabase-js';
import { processRawInput } from './services/processor.js';

const logger = pino({ transport: { target: 'pino-pretty' } });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  logger.error('SUPABASE_URL and SUPABASE_SERVICE_KEY are required');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

logger.info('Worker starting — subscribing to raw_inputs changes...');

// Subscribe to new raw_inputs with status = 'pending'
const channel = supabase
  .channel('worker-raw-inputs')
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'raw_inputs',
      filter: 'status=eq.pending',
    },
    async (payload) => {
      const record = payload.new;
      logger.info({ id: record.id, type: record.type }, 'New raw_input received');

      try {
        // Mark as processing
        await supabase
          .from('raw_inputs')
          .update({ status: 'processing' })
          .eq('id', record.id);

        // Process
        await processRawInput(supabase, record);

        logger.info({ id: record.id }, 'Processing complete');
      } catch (err) {
        logger.error({ err, id: record.id }, 'Processing failed');
        await supabase
          .from('raw_inputs')
          .update({ status: 'failed', error_message: err.message })
          .eq('id', record.id);
      }
    }
  )
  .subscribe((status) => {
    logger.info({ status }, 'Realtime subscription status');
  });

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('Shutting down worker...');
  await supabase.removeChannel(channel);
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('Shutting down worker...');
  await supabase.removeChannel(channel);
  process.exit(0);
});
