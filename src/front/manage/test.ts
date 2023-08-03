import { Jsonify } from "type-fest";

type objNestedName = {
    first: {
        name: string
    }
}

type objNestedNoName = {
    first: {
        notName: string
    }
}

type jsonWithName = Jsonify<objNestedName>
type jsonObjNestedNoName = Jsonify<objNestedNoName>