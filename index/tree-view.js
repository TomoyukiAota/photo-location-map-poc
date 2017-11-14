const $ = require('jquery');
require('jstree');
const dirTree = require('directory-tree');

const imageUtil = require('../utilities/image-utility');

const treeView = $('#tree-view');

initialize();

function initialize() {
  treeView
    .on('changed.jstree', function (e, data) {
      cascadeDownSelectedState(data);
      exports.onChanged(data);
    })
    .jstree(
    {
      'core' : 
      {
        'data' : 
        [
          { "text" : "Root node", 
            "children" : 
            [
              { "text" : "Child node 1" },
              { "text" : "Child node 2",
                "children" : 
                [
                  { "text" : "Child node 2-1" }
                ] 
              },
              { "text" : "Child node 3",
                "state": { "disabled" : true },
                "children" : 
                [
                  { "text" : "Child node 3-1",
                    "state": { "disabled" : true }
                  }
                ] 
              }
            ]
          }
        ]
      },
    });
}

exports.render = function (selectedPath) {
  const dataForJstree = getDataForJstree(selectedPath);
  treeView.jstree(true).settings.core.data = dataForJstree;
  treeView.jstree(true).deselect_all(true);
  treeView.jstree(true).close_all();
  treeView.jstree(true).refresh();
}

function getDataForJstree(selectedPath) {
  var dirTreeRoot = dirTree(selectedPath);
  if(!Array.isArray(dirTreeRoot)){
    dirTreeRoot = [dirTreeRoot];
  }
  return processDirTreeElementArray(dirTreeRoot);
}

function processDirTreeElementArray(dirTreeElementArray) {
  var jstreeElementArray = [];
  dirTreeElementArray.forEach(
    (dirTreeElement) => {
      var jstreeElement = {
        text: dirTreeElement.name,
        state: { disabled: isDisabled(dirTreeElement) }
      };
      if(dirTreeElement.hasOwnProperty("children")) {
        jstreeElement.children = processDirTreeElementArray(dirTreeElement.children);
        const isAllChildrenDisabled = jstreeElement.children.every(child => child.state.disabled);
        jstreeElement.state.disabled = isAllChildrenDisabled;
      }
      jstreeElementArray.push(jstreeElement);
    }
  );
  return jstreeElementArray;
}

function isDisabled(dirTreeElement) {
  const isFile = () => dirTreeElement.type === "file";
  const isFilenameExtensionSupported = () => 
    imageUtil.supportedFilenameExtensions.includes(dirTreeElement.extension);
  return isFile() && !isFilenameExtensionSupported();
}

/**
 * Event to be fired when tree view is changed.
 * @param {*} data data property of jstree
 */
exports.onChanged = function(data){}; //Default event handler is assigned to avoid being undefined.

exports.getSelectedNodes = function(data) {
  var i, length, selectedNodes = [];
  for (i = 0, length = data.selected.length; i < length; i++) {
    const selectedNode = data.instance.get_node(data.selected[i]);
    selectedNodes.push(selectedNode);
  }
  return selectedNodes;
}

function cascadeDownSelectedState(data) {
  const selectedNodes = exports.getSelectedNodes(data);
  selectedNodes.forEach(node => selectChildrenRecursively(node));
}

function selectChildrenRecursively(parentNode) {
  parentNode.children
    .map(id => treeView.jstree(true).get_node(id))
    .filter(node => !node.state.disabled)
    .forEach(node => {
      treeView.jstree(true).select_node(node.id, "true", "true");
      selectChildrenRecursively(node);
    });
}