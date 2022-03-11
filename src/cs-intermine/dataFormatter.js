var _ = require('underscore'),
Cymine = function(records) {
  this.records = records;
  function toNodesAndEdges(records, parentNode){
    var d = {
      nodes : [],
      edges : []
    }, selfRelationship;

    /**
    * While it's useful to see array indices if there are multiple elements,
    * There's not much point showing an index for just one array element.
    * This function collapses arrays with only one member and returns the member instead.
    * @param  {object} obj an object with arrays in its properties. Can be nested.
    * @return {object} the same object, just with 1-length arrays collapsed.
    */
    var collapseArrays = function(obj){
      var ret = {};
      _.each(obj, function(theProp, i){
        if(Array.isArray(obj)) {
          if((typeof theProp === "object")) {
            theProp = collapseArrays(theProp);
          }
          ret[theProp.name || theProp.class] = (theProp.length === 1) ? theProp[0] : theProp;
        } else {
          if(Array.isArray(theProp)) {
            ret[i] = (theProp.length === 1) ? theProp[0] : theProp;
          } else if((typeof theProp === "object")) {
            theProp = collapseArrays(theProp);
            ret[theProp.name || theProp.class] = (theProp.length === 1) ? theProp[0] : theProp;
          } else {
            ret[i] = theProp;
          }
        }


      });
      return ret;
    };

    for (var i in records) {
      var thisNode,
      row = records[i],
      newEdges;

      selfRelationship = isSelfRelationship(parentNode, row);

        thisNode = recordToNode(row, parentNode);
        if(row.interactions) {
          //recursively make the interactions into nodes,
          //because node entities are nested at two levels.
          d = _.extend(d, toNodesAndEdges(row.interactions, thisNode));
        } else {
          //if it doesn't have an interaction list, it probably *is* an interaction
          //and thus needs to be an edge
          d.edges = d.edges.concat(interactionToEdges(parentNode, thisNode));

        }
        //don't over-write the master node if it relates to itself.
        //because it makes it really hard to filter genetic/physical
        if(!selfRelationship) {
          d.nodes.push(thisNode);
        }
    }
    return d;
  }
  var isSelfRelationship = function(node1, node2){
    var isDefined, isSame;
    isDefined = node1 && node1.data.symbol && node2.gene2.symbol;
    if (isDefined) {
      isSame = node2.gene2.symbol === node1.data.symbol;
    }
    return isDefined && isSame;
  },
  recordToNode = function (obj, parentNode) {
    var ret, data = {}, interactions, label;
    ret = obj.gene2 ? obj.gene2 : obj;
    interactions = getInteractions(obj),
    label = nameNode(obj);
    return {
      classes : getClasses(interactions),
      data : {
        title : ret.class + " " + label,
        "interaction details" : prepInteractionRoles(obj.details, label, parentNode),
        label   : label,
        class   : ret.class,
        interactionTypes : interactions,
        symbol  : ret.symbol,
        id : ret.primaryIdentifier //cytoscape needs strings, not ints
      }
    };
  },
  getClasses = function(arrOfClasses){
    var ret = _.uniq(arrOfClasses); //clones the node
    if(ret.length > 1) {
      ret.push("both");
    }
    return ret.join(" ");
  },
  getInteractions = function(obj){
    var ret = [];
    if (obj.details) {
      for (var i = 0; i < obj.details.length; i++) {
        //only add the interaction type if we don't have one like this already.
        if(ret.indexOf(obj.details[i].type) < 0) {
          ret.push(obj.details[i].type);
        }
      }
    } else {
      ret.push("master");
    }
    return ret;
  },
  prepInteractionRoles = function(interaction, nodeName, parentNode){
    var ret = {};
    //if it's not empty, add the role details
    if(interaction) {
      for(var details in interaction) {
        if(interaction.hasOwnProperty(details)) {
          ret[interaction[details].name] = interaction[details];
          if(interaction[details].role1 !== "unspecified") {
            //standard interactions
            interaction[details].roles = {};
            interaction[details].roles[interaction[details].role2] = nodeName;
            interaction[details].roles[interaction[details].role1] = parentNode.data.label;
          } else {
            //flybase: no roles specified
            interaction[details].roles = "unspecified";
          }
        }
      }
    }
    //this translates roughly to a pair with "{bait:lolal, prey : adh}" or
    //similar, where role1 is for the parent node and role2 is for the child node.
    return ret || {};
  },
  nameNode = function(obj) {
    if (obj.gene2 && obj.gene2.symbol) {
      return obj.gene2.symbol;
    } else if (obj.gene2 && obj.gene2.primaryIdentifier) {
      return obj.gene2.primaryIdentifier;
    } else if (obj.symbol) {
      return obj.symbol;
    } else if (obj.details) {
      return obj.details[0].name;
    } else if (obj.primaryIdentifier) {
      return obj.primaryIdentifier;
    } else {
      return "NAME MISSING";
    }
  },
  interactionToEdges = function(node, node2) {
    var interactions = node2.data.interactionTypes,
    ret = [], roleDetails;
    for(var i = 0; i < interactions.length; i++) {
      ret.push({
        classes : interactions[i],
        data : {
          id : getInteractionId(node2, interactions[i]) + "",
          title : "Interaction between " + node.data.label + " and " + node2.data.label,
          source : node.data.id,
          target : node2.data.id,
          interactionType : interactions[i]
        }
      });
    }
    return ret;
  };
  return toNodesAndEdges(records);
},
getInteractionId = function(node, type){
  return node.data.label + "_" + type;
};

module.exports = Cymine;
