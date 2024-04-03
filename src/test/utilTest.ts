import * as assert from "assert"
import { pathToJsonPointer } from "../lib/util/utils"

describe("index", () => {
  it("get json point from json path", () => {
    let result = pathToJsonPointer("paths['Mircosoft.Compute/resoucemaneger'].operation.get[1].past")
    assert.equal(result, "/paths/Mircosoft.Compute~1resoucemaneger/operation/get/1/past")
    result = pathToJsonPointer("")
    assert.equal(result, "")
    result = pathToJsonPointer("paths['Mircosoft.Compute~resoucemaneger/test'].operation.get[1].past")
    assert.equal(result, "/paths/Mircosoft.Compute~0resoucemaneger~1test/operation/get/1/past")
    result = pathToJsonPointer("paths['Mircosoft.Compute~resouce.maneger/test'].operation.get[1].past")
    assert.equal(result, "/paths/Mircosoft.Compute~0resouce.maneger~1test/operation/get/1/past")
    result = pathToJsonPointer(
      "paths['/subscriptions/{subscriptionId}/resourceGroups/{resourceGroupName}" +
        "/providers/Microsoft.Network/loadBalancers/{loadBalancerName}'].put.parameters[3]"
    )
    assert.equal(
      result,
      "/paths/~1subscriptions~1{subscriptionId}~1resourceGroups~1" +
        "{resourceGroupName}~1providers~1Microsoft.Network~1loadBalancers~1{loadBalancerName}/put/parameters/3"
    )
  })
})
