import { Query, Resolver } from 'type-graphql'

@Resolver()
export class HealthResolver {
  // GraphQL requires a schema to define at least one query, even for projects
  // whose only resolvers are mutations (for example, the contact form alone)
  @Query(() => Boolean, { description: 'Liveness check' })
  health(): boolean {
    return true
  }
}
