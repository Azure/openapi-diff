import * as index from "../index"
import * as assert from "assert"
import {pathToJsonPointer} from '../lib/util/utils'

jest.setTimeout(20000)

describe("index", () => {
  it("get json point from json path", ()=> {
    var result = pathToJsonPointer("paths['Mircosoft.Compute/resoucemaneger'].operation.get[1].past")
    assert.equal(result,'/paths/Mircosoft.Compute~1resoucemaneger/operation/get/1/past')
    result = pathToJsonPointer("")
    assert.equal(result,"")
    result = pathToJsonPointer("paths['Mircosoft.Compute~resoucemaneger/test'].operation.get[1].past")
    assert.equal(result,"/paths/Mircosoft.Compute~0resoucemaneger~1test/operation/get/1/past")
    result = pathToJsonPointer("paths['Mircosoft.Compute~resouce.maneger/test'].operation.get[1].past")
    assert.equal(result,"/paths/Mircosoft.Compute~0resouce.maneger~1test/operation/get/1/past")
  })
})