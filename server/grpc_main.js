const { initTracer } = require('jaeger-client');
const {
  Tags: { SPAN_KIND },
  FORMAT_TEXT_MAP,
} = require('opentracing');
const path = require('path');
const grpc = require('grpc');
const protoLoader = require('@grpc/proto-loader');

const tracer = initTracer(
  {
    serviceName: 'node-jaeger-tracer-grpc-server',
    sampler: {
      type: 'const',
      param: 1,
    },
    reporter: {
      logSpans: true,
    },
  },
  {
    logger: {
      info(msg) {
        console.log('INFO', msg);
      },
      error(msg) {
        console.log('ERROR', msg);
      },
    },
  },
);

const span = tracer.startSpan('grpc-server-span', {
  tags: {
    [SPAN_KIND]: 'server',
  },
});

const metadata = {};

tracer.inject(span, FORMAT_TEXT_MAP, metadata);

span.log({
  metadata,
});

const packageDefinition = protoLoader.loadSync(path.join(__dirname, '../protos/service1.proto'), {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

const protoDescriptor = grpc.loadPackageDefinition(packageDefinition);
const client1 = new protoDescriptor.service1.Service1('0.0.0.0:20000', grpc.credentials.createInsecure());
const client2 = new protoDescriptor.service1.Service1('0.0.0.0:20001', grpc.credentials.createInsecure());

const meta = new grpc.Metadata();

Object.keys(metadata).forEach(key => {
  meta.add(key, metadata[key]);
});

async function mainloop() {
  await client1.echoCall(null, meta, err => {
    if (err) {
      console.error(err);
      span.log({
        error: true,
        msg: err.message,
      });
    }

    // w8 datagram
    setTimeout(() => {
      process.exit(0);
    }, 1000);
  });

  await client2.echoCall(null, meta, err => {
    if (err) {
      console.error(err);
      span.log({
        error: true,
        msg: err.message,
      });
    }

    // w8 datagram
    setTimeout(() => {
      process.exit(0);
    }, 1000);
  });

  span.finish();
  tracer.close();
}

mainloop();
