const express = require('express');
const { initTracer } = require('jaeger-client');
const {
  FORMAT_HTTP_HEADERS,
  Tags: { HTTP_URL, HTTP_METHOD, SPAN_KIND },
} = require('opentracing');
const app = express();

const tracer = initTracer(
  {
    serviceName: 'node-jaeger-tracer-service1',
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

app.get('/service1', function(req, res) {
  const parentSpanContext = tracer.extract(FORMAT_HTTP_HEADERS, req.headers);

  const span = tracer.startSpan('service1', {
    childOf: parentSpanContext,
    tags: {
      [SPAN_KIND]: 'service',
      [HTTP_URL]: '/service1',
      [HTTP_METHOD]: 'GET',
    },
  });
  span.log({
    headers: req.headers,
  });
  span.finish();
  tracer.close();

  res.end();
});

app.listen(19000, function() {
  console.log('service1 listening on port 19000');
});
