/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { Hono } from './hono'
import { poweredBy } from './middleware/powered-by'
import type {
  Env,
  CustomHandler as Handler,
  InputToData,
  InputToTypeData,
  ToAppType,
} from './types'
import type { Expect, Equal } from './utils/types'

describe('Test types of CustomHandler', () => {
  type E = {
    Variables: {
      foo: number
    }
  }

  const url = 'http://localhost/'

  test('No arguments', async () => {
    const app = new Hono()
    const handler: Handler = (c) => {
      const data = c.req.valid()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      type verifySchema = Expect<Equal<any, typeof data['foo']>>
      return c.text('Hi')
    }
    app.get('/', handler)
    const res = await app.request(url)
    expect(res.status).toBe(200)
  })

  test('Env', async () => {
    const app = new Hono<E>()
    const handler: Handler<E> = (c) => {
      const foo = c.get('foo')
      type verifyEnv = Expect<Equal<number, typeof foo>>
      const id = c.req.param('id')
      type verifyPath = Expect<Equal<string, typeof id>>
      const data = c.req.valid()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      type verifySchema = Expect<Equal<any, typeof data['foo']>>
      return c.text('Hi')
    }
    app.get('/', handler)
    const res = await app.request(url)
    expect(res.status).toBe(200)
  })

  test('Env, Path', async () => {
    const app = new Hono<E>()
    const handler: Handler<E, '/'> = (c) => {
      const foo = c.get('foo')
      type verifyEnv = Expect<Equal<number, typeof foo>>
      const data = c.req.valid()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      type verifySchema = Expect<Equal<any, typeof data['foo']>>
      return c.text('Hi')
    }
    app.get('/', handler)

    const res = await app.request(url)
    expect(res.status).toBe(200)
  })

  type User = {
    name: string
    age: number
  }

  test('Env, Path, Type', async () => {
    const app = new Hono<E>()
    const handler: Handler<E, '/', User> = (c) => {
      const foo = c.get('foo')
      type verifyEnv = Expect<Equal<number, typeof foo>>
      const { name, age } = c.req.valid()
      type verifySchema = Expect<Equal<string, typeof name>>
      return c.text('Hi')
    }
    app.get('/', handler)
    const res = await app.request(url)
    expect(res.status).toBe(200)
  })

  test('Type', () => {
    const handler: Handler<User> = (c) => {
      const user = c.req.valid()
      type verifySchema = Expect<Equal<User, typeof user>>
      return c.text('Hi')
    }
  })
})

describe('Types used in the validator', () => {
  test('ToAppType', () => {
    type SampleHono = Hono<
      Env,
      '/author',
      'post',
      {
        type: 'json'
        data: { name: string; age: number }
      },
      { name: string; age: number }
    >
    type Actual = ToAppType<SampleHono>
    type Expected = {
      post: {
        '/author': {
          input: {
            json: {
              name: string
              age: number
            }
          }
          output: {
            json: {
              name: string
              age: number
            }
          }
        }
      }
    }
    type verify = Expect<Equal<Expected, Actual>>
  })

  test('InputToData', () => {
    type P =
      | {}
      | { type: 'query'; data: { page: number } }
      | { type: 'form'; data: { title: string } }
    type Actual = InputToData<P>
    type Expected = {
      page: number
    } & {
      title: string
    }
    type verify = Expect<Equal<Expected, Actual>>
  })

  test('InputToTypeData', () => {
    type P =
      | {}
      | { type: 'query'; data: { page: number } }
      | { type: 'form'; data: { title: string } }
    type Actual = InputToTypeData<'query', P>
    type Expected = {
      page: number
    }
    type verify = Expect<Equal<Expected, Actual>>
  })
})

describe('`jsonT()`', () => {
  const app = new Hono<{ Variables: { foo: string } }>()

  app.get('/post/:id', (c) => {
    c.req.param('id')
    const id = c.req.param('id')
    return c.text('foo')
  })

  const route = app
    .get('/hello', (c) => {
      return c.jsonT({
        message: 'Hello!',
      })
    })
    .build()

  type Actual = typeof route

  type Expected = {
    get: {
      '/hello': {
        input: unknown
        output: {
          json: {
            message: string
          }
        }
      }
    }
  }

  type verify = Expect<Equal<Expected, Actual>>
})

describe('Env with Middleware', () => {
  type E = {
    Variables: {
      foo: string
    }
  }
  const app = new Hono<E>()
  app.use('*', poweredBy())
})
