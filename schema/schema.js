// contains all the knowledge required for telling graphQL how each object is related to each other and what kind of properties it has; what data looks like

const graphql = require('graphql');
const axios = require('axios');
const {
    GraphQLObjectType,
    GraphQLString,
    GraphQLInt,
    GraphQLSchema,
    GraphQLList,
    GraphQLNonNull
} = graphql;

const CompanyType = new GraphQLObjectType({
    name: 'Company',
    // closures - this function is defined but is not being executed until the entire file is executed (necessary for circular references)
    fields: () => ({
        id: { type: GraphQLString },
        name: { type: GraphQLString },
        description: { type: GraphQLString },
        users: {
            type: new GraphQLList(UserType),
            resolve(parentValue, args) {
                return axios.get(`http://localhost:3000/companies/${parentValue.id}/users`)
                .then(response => response.data);
            }
        }
    })
});

const UserType = new GraphQLObjectType({
    name: 'User',
    // tells the GraphQL all the properties that the user has and what type of data each field requires
    fields: () => ({
        id: { type: GraphQLString },
        firstName: { type: GraphQLString },
        age: { type: GraphQLInt },
        // userModel (real data) has companyId but the userType (graphQL schema) has company 
        // resolve function is being used to populate company field -  it takes us to another place in the graph
        company: { 
            type: CompanyType,
            // parentValue is the user that we're fetching
            resolve(parentValue, args) {
               return axios.get(`http://localhost:3000/companies/${parentValue.companyId}`)
               .then(response => response.data);
            }
        }
    })
});

// entry point telling that we can ask the app about users providing the user id and it will reply with the UserType
const RootQuery =  new GraphQLObjectType({
    name: 'RootQueryType',
    fields: {
        user: {
            type: UserType,
            args: { id: { type: GraphQLString } },
            // the place where we actually goes into the database and finds and returns the data we're looking for
            // request for data from fake json server but it can be taken from a file/database/etc.
            resolve(parentValue, args) {
                return axios.get(`http://localhost:3000/users/${args.id}`)
                    .then(response => response.data);
            }
        },
        company: {
            type: CompanyType,
            args: { id: { type: GraphQLString } },
            resolve(parentValue, args) {
                return axios.get(`http://localhost:3000/companies/${args.id}`)
                .then(response => response.data);
            }
        }
    }
});

const mutation = new GraphQLObjectType({
    name: 'Mutation',
    fields: {
        addUser: {
            // what is going to be returned from the resolve function
            type: UserType,
            // what should be provided
            args: {
                // GraphQLNonNull means that the field is obligatory - low level validation
                firstName: { type: new GraphQLNonNull(GraphQLString) },
                age: { type: new GraphQLNonNull(GraphQLInt) },
                companyId: { type: GraphQLString }
            },
            resolve(parentValue, { firstName, age }) {
                return axios.post('http://localhost:3000/users', { firstName, age })
                .then(response => response.data);
            }
        },
        deleteUser: {
            type: UserType,
            args: {
                id: { type: new GraphQLNonNull(GraphQLString)}
            },
            resolve(parentValue, { id }) {
                return axios.delete(`http://localhost:3000/users/${id}`)
                .then(response => response.data)
            }
        },
        editUser: {
            type: UserType,
            args: {
                id: { type: new GraphQLNonNull(GraphQLString)},
                firstName: { type: GraphQLString },
                age: { type: GraphQLInt },
                companyId: { type: GraphQLString }
            },
            resolve(parentValue, { id, ...rest }) {
                return axios.patch(`http://localhost:3000/users/${id}`, { id, ...rest })
                .then(response => response.data)
            }
        }
    }
})

// schema created with rootQuery and mutations
module.exports = new GraphQLSchema({
    query: RootQuery,
    mutation
});
