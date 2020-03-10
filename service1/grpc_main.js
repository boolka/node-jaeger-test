const path = require('path');
const { initTracer } = require('jaeger-client');
const {
  FORMAT_TEXT_MAP,
  Tags: { SPAN_KIND_RPC_SERVER, SPAN_KIND },
} = require('opentracing');
const grpc = require('grpc');
const protoLoader = require('@grpc/proto-loader');

const tracer = initTracer(
  {
    serviceName: 'grpc-service1',
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

const packageDefinition = protoLoader.loadSync(path.join(__dirname, '../protos/service1.proto'), {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

const protoDescriptor = grpc.loadPackageDefinition(packageDefinition);
const service1 = protoDescriptor.service1;

const server = new grpc.Server();

server.addProtoService(service1.Service1.service, {
  echoCall(call, callback) {
    const metadata = call.metadata;
    const parentSpanContext = tracer.extract(FORMAT_TEXT_MAP, {
      'uber-trace-id': metadata.get('uber-trace-id')[0],
    });

    const span = tracer.startSpan('grpc-service1-span', {
      childOf: parentSpanContext,
      tags: {
        [SPAN_KIND]: 'grpc_service1',
        [SPAN_KIND_RPC_SERVER]: true,
      },
    });

    span.log({
      metadata: {
        'uber-trace-id': metadata.get('uber-trace-id')[0],
      },
    });
    span.finish();

    callback(null);
    server.tryShutdown(() => {
      tracer.close();

      // w8 datagram
      setTimeout(() => {
        process.exit(0);
      }, 1000);
    });
  },
});

server.bind('0.0.0.0:20000', grpc.ServerCredentials.createInsecure());
server.start();
