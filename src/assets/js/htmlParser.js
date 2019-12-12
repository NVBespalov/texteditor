function treeHTML(element, object) {
    object["type"] = element.nodeName;
    var nodeList = element.childNodes;
    if (nodeList != null) {
        if (nodeList.length) {
            object["content"] = [];
            for (var i = 0; i < nodeList.length; i++) {
                if (nodeList[i].nodeType == 3) {
                    object["content"].push(nodeList[i].nodeValue);
                } else {
                    object["content"].push({});
                    treeHTML(nodeList[i], object["content"][object["content"].length -1]);
                }
            }
        }
    }
    if (element.attributes != null) {
        if (element.attributes.length) {
            object["attributes"] = {};
            for (let i = 0; i < element.attributes.length; i++) {
                object["attributes"][element.attributes[i].nodeName] = element.attributes[i].nodeValue;
            }
        }
    }
}

function mapDOM(element, stringify) {
    const treeObject = {};
    if (typeof element === "string") {
        if (window.DOMParser) {
            parser = new DOMParser();
            docNode = parser.parseFromString(element,"text/xml");
        } else { // Microsoft strikes again
            docNode = new ActiveXObject("Microsoft.XMLDOM");
            docNode.async = false;
            docNode.loadXML(element);
        }
        element = docNode.firstChild;
    }
    treeHTML(element, treeObject);
    return stringify ? JSON.stringify(treeObject) : treeObject;
}