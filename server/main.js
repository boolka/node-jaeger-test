const fetch = require('node-fetch');
const { initTracer } = require('jaeger-client');
const {
  Tags: { SPAN_KIND },
  FORMAT_HTTP_HEADERS,
} = require('opentracing');

const tracer = initTracer(
  {
    serviceName: 'node-jaeger-tracer-server',
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

const span = tracer.startSpan('service1 & service2 call', {
  tags: {
    [SPAN_KIND]: 'server',
  },
});

const headers = {};

tracer.inject(span, FORMAT_HTTP_HEADERS, headers);

span.log({
  headers,
});

fetch('http://localhost:19000/service1', {
  method: 'GET',
  headers,
})
  .then(() =>
    fetch('http://localhost:19001/service2', {
      method: 'GET',
      headers,
    }),
  )
  .then(() => {
    span.finish();
    tracer.close();
  })
  .catch(err => {
    span.log({
      error: true,
      msg: err.message,
    });

    span.finish();
    tracer.close();
  });
