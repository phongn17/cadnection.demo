var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var Example;
(function (Example) {
    var AnnotationMarkup = /** @class */ (function (_super) {
        __extends(AnnotationMarkup, _super);
        function AnnotationMarkup(viewer, nodeId, anchorPoint, label) {
            var _this = _super.call(this) || this;
            _this._leaderLine = new Communicator.Markup.Shape.Line();
            _this._textBox = new Communicator.Markup.Shape.TextBox();
            _this._showAsColor = false;
            _this._nodeId = nodeId;
            _this._viewer = viewer;
            _this._leaderAnchor = anchorPoint.copy();
            _this._textBoxAnchor = anchorPoint.copy();
            _this._textBox.setTextString(label);
            _this._textBox.getBoxPortion().setFillOpacity(1.0);
            _this._textBox.getBoxPortion().setFillColor(Communicator.Color.white());
            _this._textBox.getTextPortion().setFillColor(Communicator.Color.red());
            _this._textBox.getTextPortion().setFontSize(16);
            _this._leaderLine.setStartEndcapType(Communicator.Markup.Shape.EndcapType.Arrowhead);
            return _this;
        }
        AnnotationMarkup.prototype.draw = function () {
            this._behindView = false;
            var leaderPoint3d = this._viewer.getView().projectPoint(this._leaderAnchor);
            var boxAnchor3d = this._viewer.getView().projectPoint(this._textBoxAnchor);
            if (leaderPoint3d.z <= 0.0)
                this._behindView = true;
            if (boxAnchor3d.z <= 0.0)
                this._behindView = true;
            var leaderPoint2d = Communicator.Point2.fromPoint3(leaderPoint3d);
            var boxAnchor2d = Communicator.Point2.fromPoint3(boxAnchor3d);
            this._leaderLine.set(leaderPoint2d, boxAnchor2d);
            this._textBox.setPosition(boxAnchor2d);
            var renderer = this._viewer.getMarkupManager().getRenderer();
            renderer.drawLine(this._leaderLine);
            renderer.drawTextBox(this._textBox);
        };
        AnnotationMarkup.prototype.hit = function (point) {
            var measurement = this._viewer.getMarkupManager().getRenderer().measureTextBox(this._textBox);
            var position = this._textBox.getPosition();
            if (point.x < position.x)
                return false;
            if (point.x > position.x + measurement.x)
                return false;
            if (point.y < position.y)
                return false;
            if (point.y > position.y + measurement.y)
                return false;
            return true;
        };
        AnnotationMarkup.prototype.setShowAsColor = function (showAsColor) {
            this._showAsColor = showAsColor;
        };
        AnnotationMarkup.prototype.getShowAsColor = function () {
            return this._showAsColor;
        };
        AnnotationMarkup.prototype.getNodeId = function () {
            return this._nodeId;
        };
        AnnotationMarkup.prototype.getLeaderLineAnchor = function () {
            return this._leaderAnchor.copy();
        };
        AnnotationMarkup.prototype.getTextBoxAnchor = function () {
            return this._textBoxAnchor;
        };
        AnnotationMarkup.prototype.setTextBoxAnchor = function (newAnchorPoint) {
            this._textBoxAnchor.assign(newAnchorPoint);
        };
        AnnotationMarkup.prototype.setLabel = function (label) {
            this._textBox.setTextString(label);
        };
        AnnotationMarkup.prototype.getLabel = function () {
            return this._textBox.getTextString();
        };
        return AnnotationMarkup;
    }(Communicator.Markup.MarkupItem));
    Example.AnnotationMarkup = AnnotationMarkup;
    var AnnotationRegistry = /** @class */ (function () {
        function AnnotationRegistry(viewer, pulseManager) {
            this._annotationMap = {}; // TODO: Use a native JS Map object.
            this._viewer = viewer;
            this._pulseManager = pulseManager;
            this._table = document.getElementById("AnnotationRegistry");
        }
        AnnotationRegistry.prototype.getAnnotation = function (markupHandle) {
            return this._annotationMap[markupHandle];
        };
        AnnotationRegistry.prototype.export = function () {
            var result = [];
            var keys = Object.keys(this._annotationMap);
            for (var _i = 0, keys_1 = keys; _i < keys_1.length; _i++) {
                var key_1 = keys_1[_i];
                var annotation = this._annotationMap[key_1];
                result.push({
                    name: annotation.getLabel(),
                    position: annotation.getLeaderLineAnchor().forJson(),
                    nodeId: annotation.getNodeId(),
                    showAsColor: annotation.getShowAsColor()
                });
            }
            return JSON.stringify(result);
        };
        AnnotationRegistry.prototype.addAnnotation = function (markupHandle, annotation) {
            var _this = this;
            this._annotationMap[markupHandle] = annotation;
            var tr = document.createElement("tr");
            tr.id = markupHandle;
            var idTd = document.createElement("td");
            idTd.id = markupHandle + "-nodeId";
            idTd.innerText = annotation.getNodeId().toString();
            tr.appendChild(idTd);
            var nametd = document.createElement("td");
            nametd.id = markupHandle + "-name";
            nametd.innerText = annotation.getLabel();
            tr.appendChild(nametd);
            var actionstd = document.createElement("td");
            var renameButton = document.createElement("button");
            renameButton.innerText = "Rename";
            renameButton.onclick = function () {
                _this._renameAnnotation(markupHandle);
            };
            actionstd.appendChild(renameButton);
            var deleteButton = document.createElement("button");
            deleteButton.innerText = "Delete";
            deleteButton.onclick = function () {
                _this._deleteAnnotation(markupHandle);
            };
            actionstd.appendChild(deleteButton);
            tr.appendChild(actionstd);
            var showAsColortd = document.createElement("td");
            var showAsColor = document.createElement("input");
            showAsColor.type = "checkbox";
            showAsColor.id = markupHandle + "-showAsColor";
            showAsColor.classList.add("showAsColor");
            showAsColortd.appendChild(showAsColor);
            showAsColor.onchange = function (event) {
                _this._onPulseChange(markupHandle, event.target);
            };
            tr.appendChild(showAsColortd);
            this._table.appendChild(tr);
        };
        AnnotationRegistry.prototype._onPulseChange = function (markupHandle, target) {
            var annotation = this.getAnnotation(markupHandle);
            if (annotation === undefined) {
                return;
            }
            annotation.setShowAsColor(target.checked);
            if (target.checked) {
                this._pulseManager.add(annotation.getNodeId(), this._pulseManager.getDefaultColor1(), this._pulseManager.getDefaultColor2(), this._pulseManager.getDefaultPulseTime());
            }
            else {
                this._pulseManager.deletePulse(annotation.getNodeId());
                this._viewer.redraw();
            }
        };
        AnnotationRegistry.prototype._renameAnnotation = function (markupHandle) {
            var annotation = this._annotationMap[markupHandle];
            if (annotation === undefined) {
                return;
            }
            var newMarkupName = prompt("Enter a new name for " + annotation.getLabel(), annotation.getLabel());
            if (newMarkupName != null) {
                annotation.setLabel(newMarkupName);
                this._viewer.getMarkupManager().refreshMarkup();
                var element = document.getElementById(markupHandle + "-name");
                if (element !== null) {
                    element.innerText = newMarkupName;
                }
            }
        };
        AnnotationRegistry.prototype._deleteAnnotation = function (markupHandle) {
            this._viewer.getMarkupManager().unregisterMarkup(markupHandle);
            var annotation = this._annotationMap[markupHandle];
            if (annotation !== undefined) {
                this._pulseManager.deletePulse(annotation.getNodeId());
                delete this._annotationMap[markupHandle];
            }
            var element = document.getElementById(markupHandle);
            if (element !== null && element.parentElement !== null) {
                element.parentElement.removeChild(element);
            }
        };
        return AnnotationRegistry;
    }());
    Example.AnnotationRegistry = AnnotationRegistry;
    var AnnotationOperator = /** @class */ (function (_super) {
        __extends(AnnotationOperator, _super);
        function AnnotationOperator(viewer, annotationRegistry) {
            var _this = _super.call(this) || this;
            _this._previousAnchorPlaneDragPoint = null;
            _this._activeMarkup = null;
            _this._annotationCount = 1;
            _this._previousNodeId = null;
            _this._viewer = viewer;
            _this._annotationRegistry = annotationRegistry;
            return _this;
        }
        AnnotationOperator.prototype.needsSelection = function (eventType) {
            return (eventType === Communicator.EventType.MouseDown);
        };
        AnnotationOperator.prototype.onMouseDown = function (event) {
            var selection = event._getPickResult(this._selectionMask(Communicator.EventType.MouseDown));
            if (selection !== null && selection.overlayIndex() !== 0)
                return;
            var downPosition = event.getPosition();
            if (this._selectAnnotation(downPosition)) {
                event.setHandled(true);
            }
            else if (selection !== null && selection.isNodeEntitySelection()) {
                this._annotationCount++;
                var nodeId = selection.getNodeId();
                var selectionPosition = selection.getPosition();
                var annotationMarkup = new AnnotationMarkup(this._viewer, nodeId, selectionPosition, this._viewer.getModel().getNodeName(nodeId) + " Connector");
                var markupHandle = this._viewer.getMarkupManager().registerMarkup(annotationMarkup);
                this._annotationRegistry.addAnnotation(markupHandle, annotationMarkup);
                this._startDraggingAnnotation(annotationMarkup, downPosition);
                event.setHandled(true);
            }
        };
        AnnotationOperator.prototype._startDraggingAnnotation = function (annotation, downPosition) {
            this._activeMarkup = annotation;
            this._previousAnchorPlaneDragPoint = this._getDragPointOnAnchorPlane(downPosition);
        };
        AnnotationOperator.prototype._selectAnnotation = function (selectPoint) {
            var markup = this._viewer.getMarkupManager().pickMarkupItem(selectPoint);
            if (markup) {
                this._activeMarkup = markup;
                this._previousAnchorPlaneDragPoint = this._getDragPointOnAnchorPlane(selectPoint);
                return true;
            }
            else {
                return false;
            }
        };
        AnnotationOperator.prototype.onDeactivate = function () {
            if (this._previousNodeId != null) {
                this._viewer.getModel().setNodesHighlighted([this._previousNodeId], false);
            }
            this._previousNodeId = null;
        };
        AnnotationOperator.prototype.onMouseMove = function (event) {
            var _this = this;
            if (this._activeMarkup !== null) {
                var currentAnchorPlaneDragPoint = this._getDragPointOnAnchorPlane(event.getPosition());
                var dragDelta = void 0;
                if (this._previousAnchorPlaneDragPoint !== null && currentAnchorPlaneDragPoint !== null) {
                    dragDelta = Communicator.Point3.subtract(currentAnchorPlaneDragPoint, this._previousAnchorPlaneDragPoint);
                }
                else {
                    dragDelta = Communicator.Point3.zero();
                }
                var newAnchorPos = this._activeMarkup.getTextBoxAnchor().add(dragDelta);
                this._activeMarkup.setTextBoxAnchor(newAnchorPos);
                this._previousAnchorPlaneDragPoint = currentAnchorPlaneDragPoint;
                this._viewer.getMarkupManager().refreshMarkup();
                event.setHandled(true);
            }
            else {
                this._viewer.getView().pickFromPoint(event.getPosition(), new Communicator.PickConfig()).then(function (pickResult) {
                    var selectedNodeId = pickResult.getNodeId();
                    if (selectedNodeId !== _this._previousNodeId) {
                        if (_this._previousNodeId != null) {
                            _this._viewer.getModel().setNodesHighlighted([_this._previousNodeId], false);
                        }
                        if (selectedNodeId != null) {
                            _this._viewer.getModel().setNodesHighlighted([selectedNodeId], true);
                        }
                    }
                    _this._previousNodeId = selectedNodeId;
                });
            }
        };
        AnnotationOperator.prototype.onMouseUp = function (event) {
            event; // unreferenced
            this._activeMarkup = null;
            this._previousAnchorPlaneDragPoint = null;
        };
        AnnotationOperator.prototype._getDragPointOnAnchorPlane = function (screenPoint) {
            if (this._activeMarkup === null) {
                return null;
            }
            var anchor = this._activeMarkup.getLeaderLineAnchor();
            var camera = this._viewer.getView().getCamera();
            var normal = Communicator.Point3.subtract(camera.getPosition(), anchor).normalize();
            var anchorPlane = Communicator.Plane.createFromPointAndNormal(anchor, normal);
            var raycast = this._viewer.getView().raycastFromPoint(screenPoint);
            if (raycast === null) {
                return null;
            }
            var intersectionPoint = Communicator.Point3.zero();
            if (anchorPlane.intersectsRay(raycast, intersectionPoint)) {
                return intersectionPoint;
            }
            else {
                return null;
            }
        };
        return AnnotationOperator;
    }(Communicator.Operator.Operator));
    Example.AnnotationOperator = AnnotationOperator;
})(Example || (Example = {}));
/// <reference path="../js/hoops_web_viewer.d.ts"/>
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = y[op[0] & 2 ? "return" : op[0] ? "throw" : "next"]) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [0, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var Communicator;
(function (Communicator) {
    var Ui;
    (function (Ui) {
        var Context;
        (function (Context) {
            var ContextMenuItem = /** @class */ (function () {
                function ContextMenuItem(action, element) {
                    this.action = action;
                    this.element = element;
                }
                ContextMenuItem.prototype.setEnabled = function (enabled) {
                    if (enabled)
                        $(this.element).removeClass("disabled");
                    else
                        $(this.element).addClass("disabled");
                };
                ContextMenuItem.prototype.setText = function (text) {
                    this.element.innerHTML = text;
                };
                ContextMenuItem.prototype.show = function () {
                    $(this.element).show();
                };
                ContextMenuItem.prototype.hide = function () {
                    $(this.element).hide();
                };
                return ContextMenuItem;
            }());
            Context.ContextMenuItem = ContextMenuItem;
            var ContextMenu = /** @class */ (function () {
                function ContextMenu(menuClass, containerId, viewer, isolateZoomHelper) {
                    var _this = this;
                    this._transparencyIdHash = new Map();
                    this._activeItemId = null;
                    this._activeLayerName = null;
                    this._activeType = null;
                    this._separatorCount = 0;
                    this._position = null;
                    this._modifiers = Communicator.KeyModifiers.None;
                    this._viewer = viewer;
                    this._containerId = containerId;
                    this._isolateZoomHelper = isolateZoomHelper;
                    this._menuElement = this._createMenuElement(menuClass);
                    this._contextLayer = this._createContextLayer();
                    this._initElements();
                    this._viewer.setCallbacks({
                        _firstModelLoaded: function () {
                            _this._onNewModel();
                            return Promise.resolve();
                        },
                        modelSwitched: function () {
                            _this._onNewModel();
                        }
                    });
                }
                ContextMenu.prototype._getContextItemMap = function () {
                    return this._contextItemMap;
                };
                ContextMenu.prototype._onNewModel = function () {
                    if (this._viewer.isDrawingSheetActive()) {
                        this._contextItemMap.reset.hide();
                        if (this._contextItemMap.meshlevel0 !== undefined)
                            this._contextItemMap.meshlevel0.hide();
                        if (this._contextItemMap.meshlevel1 !== undefined)
                            this._contextItemMap.meshlevel1.hide();
                        if (this._contextItemMap.meshlevel2 !== undefined)
                            this._contextItemMap.meshlevel2.hide();
                        $(".contextmenu-separator-3").hide();
                    }
                };
                ContextMenu.prototype._isMenuItemEnabled = function () {
                    if (this._activeLayerName !== null || this._activeType !== null || (this._activeItemId !== null && !this._viewer._getNoteTextManager().checkPinInstance(this._activeItemId))) {
                        return true;
                    }
                    var axisOverlay = 1;
                    var selectionItems = this._viewer.selectionManager.getResults();
                    for (var _i = 0, selectionItems_1 = selectionItems; _i < selectionItems_1.length; _i++) {
                        var item = selectionItems_1[_i];
                        if (item.overlayIndex() !== axisOverlay) {
                            return true;
                        }
                    }
                    return false;
                };
                ContextMenu.prototype._isMenuItemVisible = function () {
                    var activeItemVisible = this._isItemVisible(this._activeItemId);
                    var activeLayerVisible = this._isLayerVisibile(this._activeLayerName);
                    var activeTypeVisibile = this._isTypeVisible(this._activeType);
                    return activeItemVisible || activeLayerVisible || activeTypeVisibile;
                };
                ContextMenu.prototype._updateMenuItems = function () {
                    var menuItemEnabled = this._isMenuItemEnabled();
                    var menuItemVisible = this._isMenuItemVisible();
                    this._contextItemMap.visibility.setText(menuItemVisible ? "Hide" : "Show");
                    this._contextItemMap.visibility.setEnabled(menuItemEnabled);
                    this._contextItemMap.isolate.setEnabled(menuItemEnabled);
                    this._contextItemMap.zoom.setEnabled(menuItemEnabled);
                    this._contextItemMap.transparent.setEnabled(menuItemEnabled);
                    var handleOperator = this._viewer.operatorManager.getOperator(Communicator.OperatorId.Handle);
                    if (handleOperator && handleOperator.isEnabled && menuItemEnabled) {
                        var enableHandles = (this.getContextItemIds(true, true, false).length > 0) && handleOperator.isEnabled();
                        this._contextItemMap.handles.setEnabled(enableHandles);
                    }
                    else {
                        this._contextItemMap.handles.setEnabled(false);
                    }
                    if (this._contextItemMap.meshlevel0 !== undefined) {
                        this._contextItemMap.meshlevel0.setEnabled(menuItemEnabled);
                    }
                    if (this._contextItemMap.meshlevel1 !== undefined) {
                        this._contextItemMap.meshlevel1.setEnabled(menuItemEnabled);
                    }
                    if (this._contextItemMap.meshlevel2 !== undefined) {
                        this._contextItemMap.meshlevel2.setEnabled(menuItemEnabled);
                    }
                };
                ContextMenu.prototype.setActiveLayerName = function (layerName) {
                    this._activeLayerName = Ui.LayersTree.getLayerName(layerName);
                    this._updateMenuItems();
                };
                ContextMenu.prototype.setActiveType = function (genericType) {
                    this._activeType = genericType;
                    this._updateMenuItems();
                };
                ContextMenu.prototype.setActiveItemId = function (activeItemId) {
                    this._activeItemId = activeItemId;
                    this._updateMenuItems();
                };
                ContextMenu.prototype.showElements = function (position) {
                    this._viewer.setContextMenuStatus(true);
                    var canvasSize = this._viewer.view.getCanvasSize();
                    var menuElement = $(this._menuElement);
                    var menuWidth = menuElement.outerWidth();
                    var menuHeight = menuElement.outerHeight();
                    //make the context menu smaller if it is taller than the screen
                    if (menuHeight !== undefined && menuWidth !== undefined) {
                        if (menuHeight > canvasSize.y) {
                            menuElement.addClass("small");
                        }
                        var positionY = position.y;
                        var positionX = position.x;
                        // check for overflow y
                        if ((positionY + menuHeight) > canvasSize.y) {
                            positionY = canvasSize.y - menuHeight - 1;
                        }
                        //check for overflow x
                        if ((positionX + menuWidth) > canvasSize.x) {
                            positionX = canvasSize.x - menuWidth - 1;
                        }
                        $(this._menuElement).css({
                            left: positionX + "px",
                            top: positionY + "px",
                            display: "block",
                        });
                    }
                    $(this._menuElement).show();
                    $(this._contextLayer).show();
                };
                ContextMenu.prototype._onContextLayerClick = function (event) {
                    if (event.button === 0)
                        this.hide();
                };
                ContextMenu.prototype.hide = function () {
                    this._viewer.setContextMenuStatus(false);
                    this._activeItemId = null;
                    this._activeLayerName = null;
                    this._activeType = null;
                    $(this._menuElement).hide();
                    $(this._contextLayer).hide();
                    $(this._menuElement).removeClass("small");
                };
                ContextMenu.prototype.action = function (action) {
                    var contextMenuItem = this._contextItemMap[action];
                    if (contextMenuItem !== undefined) {
                        contextMenuItem.action();
                    }
                };
                ContextMenu.prototype._doMenuClick = function (event) {
                    var $target = $(event.target);
                    if ($target.hasClass("disabled"))
                        return;
                    var itemId = $target.attr("id");
                    if (itemId !== undefined) {
                        this.action(itemId);
                    }
                    this.hide();
                };
                ContextMenu.prototype._createMenuElement = function (menuClass) {
                    var _this = this;
                    var menuElement = document.createElement("div");
                    menuElement.classList.add("ui-contextmenu");
                    menuElement.classList.add(menuClass);
                    menuElement.style.position = "absolute";
                    menuElement.style.zIndex = "6";
                    menuElement.style.display = "none";
                    menuElement.oncontextmenu = function () {
                        return false;
                    };
                    menuElement.ontouchmove = function (event) {
                        event.preventDefault();
                    };
                    $(menuElement).on("click", ".ui-contextmenu-item", function (event) {
                        _this._doMenuClick(event);
                    });
                    return menuElement;
                };
                ContextMenu.prototype._createContextLayer = function () {
                    var _this = this;
                    var contextLayer = document.createElement("div");
                    contextLayer.style.position = "relative";
                    contextLayer.style.width = "100%";
                    contextLayer.style.height = "100%";
                    contextLayer.style.backgroundColor = "transparent";
                    contextLayer.style.zIndex = "5";
                    contextLayer.style.display = "none";
                    contextLayer.oncontextmenu = function () {
                        return false;
                    };
                    contextLayer.ontouchmove = function (event) {
                        event.preventDefault();
                    };
                    $(contextLayer).on("mousedown", function (event) {
                        _this._onContextLayerClick(event);
                    });
                    return contextLayer;
                };
                ContextMenu.prototype._initElements = function () {
                    this._createDefaultMenuItems();
                    var container = document.getElementById(this._containerId);
                    if (container !== null) {
                        container.appendChild(this._menuElement);
                        container.appendChild(this._contextLayer);
                    }
                };
                ContextMenu.prototype._isMenuItemExecutable = function () {
                    return this._activeItemId !== null || this._activeLayerName !== null || this._activeType !== null || this._viewer.selectionManager.size() > 0;
                };
                ContextMenu.prototype._createDefaultMenuItems = function () {
                    var _this = this;
                    var model = this._viewer.model;
                    var operatorManager = this._viewer.operatorManager;
                    this._contextItemMap = {};
                    var isAllIfcSpace = function (nodeIds) {
                        return nodeIds.every(function (nodeId) {
                            return model._hasEffectiveGenericType(nodeId, Communicator.StaticGenericType.IfcSpace);
                        });
                    };
                    var isolateFunc = function () { return __awaiter(_this, void 0, void 0, function () {
                        var nodeIds;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    if (!this._isMenuItemExecutable()) return [3 /*break*/, 2];
                                    nodeIds = this.getContextItemIds(true, true);
                                    return [4 /*yield*/, this._isolateZoomHelper.isolateNodes(nodeIds, isAllIfcSpace(nodeIds) ? false : null)];
                                case 1:
                                    _a.sent();
                                    _a.label = 2;
                                case 2: return [2 /*return*/];
                            }
                        });
                    }); };
                    var zoomFunc = function () { return __awaiter(_this, void 0, void 0, function () {
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    if (!this._isMenuItemExecutable()) return [3 /*break*/, 2];
                                    return [4 /*yield*/, this._isolateZoomHelper.fitNodes(this.getContextItemIds(true, true))];
                                case 1:
                                    _a.sent();
                                    _a.label = 2;
                                case 2: return [2 /*return*/];
                            }
                        });
                    }); };
                    var visibilityFunc = function () { return __awaiter(_this, void 0, void 0, function () {
                        var visible, nodeIds;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    if (!this._isMenuItemExecutable()) return [3 /*break*/, 2];
                                    visible = !this._isMenuItemVisible();
                                    nodeIds = this.getContextItemIds(true, true);
                                    return [4 /*yield*/, model.setNodesVisibility(nodeIds, visible, isAllIfcSpace(nodeIds) ? false : null)];
                                case 1:
                                    _a.sent();
                                    _a.label = 2;
                                case 2: return [2 /*return*/];
                            }
                        });
                    }); };
                    var transparentFunc = function () { return __awaiter(_this, void 0, void 0, function () {
                        var contextItemIds, _i, contextItemIds_1, id, _a, contextItemIds_2, id;
                        return __generator(this, function (_b) {
                            if (this._isMenuItemExecutable()) {
                                contextItemIds = this.getContextItemIds(true, true);
                                if (this._transparencyIdHash.get(contextItemIds[0]) === undefined) {
                                    for (_i = 0, contextItemIds_1 = contextItemIds; _i < contextItemIds_1.length; _i++) {
                                        id = contextItemIds_1[_i];
                                        this._transparencyIdHash.set(id, 1);
                                    }
                                    model.setNodesOpacity(contextItemIds, 0.5);
                                }
                                else {
                                    for (_a = 0, contextItemIds_2 = contextItemIds; _a < contextItemIds_2.length; _a++) {
                                        id = contextItemIds_2[_a];
                                        this._transparencyIdHash.delete(id);
                                    }
                                    model.resetNodesOpacity(contextItemIds);
                                }
                            }
                            return [2 /*return*/];
                        });
                    }); };
                    var handlesFunc = function () { return __awaiter(_this, void 0, void 0, function () {
                        var handleOperator, contextItemIds;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    if (!this._isMenuItemExecutable()) return [3 /*break*/, 2];
                                    handleOperator = operatorManager.getOperator(Communicator.OperatorId.Handle);
                                    contextItemIds = this.getContextItemIds(true, true, false);
                                    if (!(contextItemIds.length > 0)) return [3 /*break*/, 2];
                                    return [4 /*yield*/, handleOperator.addHandles(contextItemIds, (this._modifiers === Communicator.KeyModifiers.Shift ? null : this._position))];
                                case 1:
                                    _a.sent();
                                    _a.label = 2;
                                case 2: return [2 /*return*/];
                            }
                        });
                    }); };
                    var resetFunc = function () { return __awaiter(_this, void 0, void 0, function () {
                        var handleOperator;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    model.reset(); // XXX: Returns a promise.
                                    handleOperator = operatorManager.getOperator(Communicator.OperatorId.Handle);
                                    return [4 /*yield*/, handleOperator.removeHandles()];
                                case 1:
                                    _a.sent(); // XXX: Returns a promise.
                                    return [2 /*return*/];
                            }
                        });
                    }); };
                    var meshLevelFunc = function (meshLevel) { return __awaiter(_this, void 0, void 0, function () {
                        return __generator(this, function (_a) {
                            if (this._isMenuItemExecutable()) {
                                model.setMeshLevel(this.getContextItemIds(true, true), meshLevel);
                            }
                            return [2 /*return*/];
                        });
                    }); };
                    var showAllFunc = function () { return __awaiter(_this, void 0, void 0, function () {
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0: return [4 /*yield*/, this._isolateZoomHelper.showAll()];
                                case 1:
                                    _a.sent();
                                    return [2 /*return*/];
                            }
                        });
                    }); };
                    this.appendItem("isolate", "Isolate", isolateFunc);
                    this.appendItem("zoom", "Zoom", zoomFunc);
                    this.appendItem("visibility", "Hide", visibilityFunc);
                    this.appendSeparator();
                    this.appendItem("transparent", "Transparent", transparentFunc);
                    this.appendSeparator();
                    this.appendItem("handles", "Show Handles", handlesFunc);
                    this.appendItem("reset", "Reset Model", resetFunc);
                    // Mesh level options should only be shown if the model is streaming from the server
                    if (this._viewer.getCreationParameters().hasOwnProperty("model")) {
                        this.appendSeparator();
                        var _loop_1 = function (i) {
                            this_1.appendItem("meshlevel" + i, "Mesh Level " + i, function () { return __awaiter(_this, void 0, void 0, function () {
                                return __generator(this, function (_a) {
                                    meshLevelFunc(i);
                                    return [2 /*return*/];
                                });
                            }); });
                        };
                        var this_1 = this;
                        for (var i = 0; i < 3; ++i) {
                            _loop_1(i);
                        }
                    }
                    this.appendSeparator();
                    this.appendItem("showall", "Show all", showAllFunc);
                };
                ContextMenu.prototype.getContextItemIds = function (includeSelected, includeClicked, includeRoot) {
                    if (includeRoot === void 0) { includeRoot = true; }
                    var selectionManager = this._viewer.selectionManager;
                    var model = this._viewer.model;
                    var rootId = model.getAbsoluteRootNode();
                    var itemIds = [];
                    // selected items
                    if (includeSelected) {
                        var selectedItems = selectionManager.getResults();
                        for (var _i = 0, selectedItems_1 = selectedItems; _i < selectedItems_1.length; _i++) {
                            var item = selectedItems_1[_i];
                            var id = item.getNodeId();
                            if (model.isNodeLoaded(id) && (includeRoot || (!includeRoot && id !== rootId))) {
                                itemIds.push(id);
                            }
                        }
                    }
                    if (this._activeLayerName !== null) {
                        var layerIds = this._viewer.model.getLayerIdsFromName(this._activeLayerName);
                        if (layerIds !== null) {
                            for (var _a = 0, layerIds_1 = layerIds; _a < layerIds_1.length; _a++) {
                                var layerId = layerIds_1[_a];
                                var nodeIds = this._viewer.model.getNodesFromLayer(layerId);
                                if (nodeIds !== null) {
                                    for (var _b = 0, nodeIds_1 = nodeIds; _b < nodeIds_1.length; _b++) {
                                        var nodeId = nodeIds_1[_b];
                                        var selectionItem = Communicator.Selection.SelectionItem.create(nodeId);
                                        if (!selectionManager.contains(selectionItem)) {
                                            itemIds.push(nodeId);
                                        }
                                    }
                                }
                            }
                        }
                    }
                    if (this._activeType !== null) {
                        var nodeIds = this._viewer.model.getNodesByGenericType(this._activeType);
                        if (nodeIds !== null) {
                            nodeIds.forEach(function (nodeId) {
                                var selectionItem = Communicator.Selection.SelectionItem.create(nodeId);
                                if (!selectionManager.contains(selectionItem)) {
                                    itemIds.push(nodeId);
                                }
                            });
                        }
                    }
                    if (this._activeItemId !== null) {
                        var selectionItem = Communicator.Selection.SelectionItem.create(this._activeItemId);
                        var containsParent = selectionManager.containsParent(selectionItem) !== null;
                        var containsItem = itemIds.indexOf(this._activeItemId) !== -1;
                        // also include items if they are clicked on but not selected (and not a child of a parent that is selected)
                        if (includeClicked
                            && (includeRoot
                                || (!includeRoot && this._activeItemId !== rootId)
                                    && (itemIds.length === 0 || (!containsItem && !containsParent)))) {
                            itemIds.push(this._activeItemId);
                        }
                    }
                    return itemIds;
                };
                ContextMenu.prototype.appendItem = function (itemId, label, action) {
                    var item = document.createElement("div");
                    item.classList.add("ui-contextmenu-item");
                    item.innerHTML = label;
                    item.id = itemId;
                    this._menuElement.appendChild(item);
                    var contextMenuItem = new ContextMenuItem(action, item);
                    this._contextItemMap[itemId] = contextMenuItem;
                    return contextMenuItem;
                };
                ContextMenu.prototype.appendSeparator = function () {
                    var item = document.createElement("div");
                    item.classList.add("contextmenu-separator-" + this._separatorCount++);
                    item.classList.add("ui-contextmenu-separator");
                    item.style.width = "100%";
                    item.style.height = "1px";
                    this._menuElement.appendChild(item);
                };
                ContextMenu.prototype._isItemVisible = function (nodeId) {
                    if (nodeId === null) {
                        var selectionItems = this._viewer.selectionManager.getResults();
                        if (selectionItems.length === 0) {
                            return false;
                        }
                        nodeId = selectionItems[0].getNodeId();
                    }
                    return this._viewer.model.getNodeVisibility(nodeId);
                };
                ContextMenu.prototype._isLayerVisibile = function (layerName) {
                    if (layerName !== null) {
                        var layerIds = this._viewer.model.getLayerIdsFromName(layerName);
                        if (layerIds !== null) {
                            for (var _i = 0, layerIds_2 = layerIds; _i < layerIds_2.length; _i++) {
                                var layerId = layerIds_2[_i];
                                var nodeIds = this._viewer.model.getNodesFromLayer(layerId);
                                if (nodeIds !== null) {
                                    for (var _a = 0, nodeIds_2 = nodeIds; _a < nodeIds_2.length; _a++) {
                                        var nodeId = nodeIds_2[_a];
                                        if (this._viewer.model.getNodeVisibility(nodeId)) {
                                            return true;
                                        }
                                    }
                                }
                            }
                        }
                    }
                    return false;
                };
                ContextMenu.prototype._isTypeVisible = function (genericType) {
                    var _this = this;
                    var typeVisible = false;
                    if (genericType !== null) {
                        var nodeIds = this._viewer.model.getNodesByGenericType(genericType);
                        if (nodeIds !== null) {
                            nodeIds.forEach(function (nodeId) {
                                typeVisible = typeVisible || _this._viewer.model.getNodeVisibility(nodeId);
                            });
                        }
                    }
                    return typeVisible;
                };
                return ContextMenu;
            }());
            Context.ContextMenu = ContextMenu;
        })(Context = Ui.Context || (Ui.Context = {}));
    })(Ui = Communicator.Ui || (Communicator.Ui = {}));
})(Communicator || (Communicator = {}));
/// <reference path="../js/hoops_web_viewer.d.ts"/>
var Communicator;
(function (Communicator) {
    var Ui;
    (function (Ui) {
        var AxisIndex;
        (function (AxisIndex) {
            AxisIndex[AxisIndex["X"] = 0] = "X";
            AxisIndex[AxisIndex["Y"] = 1] = "Y";
            AxisIndex[AxisIndex["Z"] = 2] = "Z";
            AxisIndex[AxisIndex["FACE"] = 3] = "FACE";
        })(AxisIndex = Ui.AxisIndex || (Ui.AxisIndex = {}));
        var CuttingPlaneInfo = /** @class */ (function () {
            function CuttingPlaneInfo() {
                this.plane = null;
                this.referenceGeometry = null;
                this.status = 0 /* Hidden */;
                this.updateReferenceGeometry = false;
            }
            return CuttingPlaneInfo;
        }());
        Ui.CuttingPlaneInfo = CuttingPlaneInfo;
        var CuttingPlaneController = /** @class */ (function () {
            function CuttingPlaneController(viewer) {
                var _this = this;
                this._cuttingSections = [];
                this._modelBounding = new Communicator.Box();
                this._planeInfo = new Map();
                this._showReferenceGeometry = true;
                this._useIndividualCuttingSections = true;
                this._boundingBoxUpdate = false;
                this._faceSelection = null;
                this._assemblyTreeReadyOccurred = false;
                this._pendingFuncs = {};
                this._viewer = viewer;
                this.resetCuttingPlanes();
                var refreshCuttingPlanes = function () {
                    return _this._updateBoundingBox().then(function () {
                        return _this.resetCuttingPlanes();
                    });
                };
                this._viewer.setCallbacks({
                    _assemblyTreeReady: function () {
                        var ps = [];
                        ps.push(_this._initSection());
                        _this._assemblyTreeReadyOccurred = true;
                        ps.push(_this._updateBoundingBox());
                        return Communicator.Util.waitForAll(ps);
                    },
                    visibilityChanged: function () {
                        _this._updateBoundingBox();
                    },
                    hwfParseComplete: function () {
                        _this._updateBoundingBox();
                    },
                    _firstModelLoaded: refreshCuttingPlanes,
                    _modelSwitched: refreshCuttingPlanes,
                    _resetAssemblyTreeBegin: function () {
                        return _this._clearCuttingSections();
                    },
                });
            }
            CuttingPlaneController.prototype._getCuttingStatus = function (axis, plane) {
                if (plane.normal.x >= 0 && plane.normal.y >= 0 && plane.normal.z >= 0 || axis === AxisIndex.FACE) {
                    return 1 /* Visible */;
                }
                else {
                    return 2 /* Inverted */;
                }
            };
            CuttingPlaneController.prototype.onSectionsChanged = function () {
                var _this = this;
                var planes = [];
                var referenceGeometry = [];
                var referenceGeometryShown = false;
                var useIndividualCuttingSections = false;
                var cuttingSectionX = this._cuttingSections[0];
                var cuttingSectionY = this._cuttingSections[1];
                var cuttingSectionZ = this._cuttingSections[2];
                var cuttingSectionFace = this._cuttingSections[3];
                if (cuttingSectionX.getCount() > 1) {
                    planes[0] = cuttingSectionX.getPlane(0);
                    planes[1] = cuttingSectionX.getPlane(1);
                    planes[2] = cuttingSectionX.getPlane(2);
                    planes[3] = cuttingSectionX.getPlane(3);
                    referenceGeometry[0] = cuttingSectionX.getReferenceGeometry(0);
                    referenceGeometry[1] = cuttingSectionX.getReferenceGeometry(1);
                    referenceGeometry[2] = cuttingSectionX.getReferenceGeometry(2);
                    referenceGeometry[3] = cuttingSectionX.getReferenceGeometry(3);
                }
                else {
                    useIndividualCuttingSections = true;
                    planes[0] = cuttingSectionX.getPlane(0);
                    planes[1] = cuttingSectionY.getPlane(0);
                    planes[2] = cuttingSectionZ.getPlane(0);
                    planes[3] = cuttingSectionFace.getPlane(0);
                    referenceGeometry[0] = cuttingSectionX.getReferenceGeometry(0);
                    referenceGeometry[1] = cuttingSectionY.getReferenceGeometry(0);
                    referenceGeometry[2] = cuttingSectionZ.getReferenceGeometry(0);
                    referenceGeometry[3] = cuttingSectionFace.getReferenceGeometry(0);
                }
                if (referenceGeometry[0] !== null ||
                    referenceGeometry[1] !== null ||
                    referenceGeometry[2] !== null ||
                    referenceGeometry[3] !== null) {
                    referenceGeometryShown = true;
                }
                this._resetCuttingData();
                this._showReferenceGeometry = referenceGeometryShown;
                this._useIndividualCuttingSections = useIndividualCuttingSections;
                for (var i = 0; i < planes.length; ++i) {
                    var plane = planes[i];
                    if (plane !== null) {
                        var axis = this._getPlaneAxis(plane);
                        var planeInfo = this._ensurePlaneInfo(axis);
                        if (planeInfo.status === 0 /* Hidden */) {
                            planeInfo.status = this._getCuttingStatus(axis, plane);
                            planeInfo.plane = plane;
                            planeInfo.referenceGeometry = referenceGeometry[i];
                        }
                    }
                }
                this._viewer.pauseRendering();
                return this._clearCuttingSections().then(function () {
                    return _this._restorePlanes().then(function () {
                        _this._viewer.resumeRendering();
                    });
                });
            };
            CuttingPlaneController.prototype._getPlaneAxis = function (plane) {
                var x = Math.abs(plane.normal.x);
                var y = Math.abs(plane.normal.y);
                var z = Math.abs(plane.normal.z);
                if (x === 1 && y === 0 && z === 0) {
                    return AxisIndex.X;
                }
                else if (x === 0 && y === 1 && z === 0) {
                    return AxisIndex.Y;
                }
                else if (x === 0 && y === 0 && z === 1) {
                    return AxisIndex.Z;
                }
                else {
                    return AxisIndex.FACE;
                }
            };
            CuttingPlaneController.prototype.getReferenceGeometryEnabled = function () {
                return this._showReferenceGeometry;
            };
            CuttingPlaneController.prototype.getIndividualCuttingSectionEnabled = function () {
                return this._useIndividualCuttingSections;
            };
            CuttingPlaneController.prototype.getPlaneInfo = function (axis) {
                return this._planeInfo.get(axis);
            };
            CuttingPlaneController.prototype._ensurePlaneInfo = function (axis) {
                var planeInfo = this._planeInfo.get(axis);
                if (planeInfo === undefined) {
                    planeInfo = new CuttingPlaneInfo();
                    this._planeInfo.set(axis, planeInfo);
                }
                return planeInfo;
            };
            CuttingPlaneController.prototype._setStatus = function (axis, status) {
                this._ensurePlaneInfo(axis).status = status;
            };
            CuttingPlaneController.prototype._updateBoundingBox = function () {
                var _this = this;
                if (!this._boundingBoxUpdate && this._assemblyTreeReadyOccurred) {
                    this._boundingBoxUpdate = true;
                    return this._viewer.model.getModelBounding(true, false).then(function (modelBounding) {
                        var minDiff = _this._modelBounding.min.equalsWithTolerance(modelBounding.min, .01);
                        var maxDiff = _this._modelBounding.max.equalsWithTolerance(modelBounding.max, .01);
                        var p;
                        if (!minDiff || !maxDiff) {
                            _this._modelBounding = modelBounding;
                            _this._ensurePlaneInfo(AxisIndex.X).updateReferenceGeometry = true;
                            _this._ensurePlaneInfo(AxisIndex.Y).updateReferenceGeometry = true;
                            _this._ensurePlaneInfo(AxisIndex.Z).updateReferenceGeometry = true;
                            _this._ensurePlaneInfo(AxisIndex.FACE).updateReferenceGeometry = true;
                            var activeStates_1 = [
                                _this._isActive(AxisIndex.X),
                                _this._isActive(AxisIndex.Y),
                                _this._isActive(AxisIndex.Z),
                                _this._isActive(AxisIndex.FACE),
                            ];
                            _this._storePlanes();
                            p = _this._clearCuttingSections().then(function () {
                                return _this._restorePlanes(activeStates_1);
                            });
                        }
                        else {
                            p = Promise.resolve();
                        }
                        return p.then(function () {
                            _this._boundingBoxUpdate = false;
                        });
                    });
                }
                else {
                    return Promise.resolve();
                }
            };
            CuttingPlaneController.prototype._resetAxis = function (axis) {
                this._planeInfo.delete(axis);
                if (axis === AxisIndex.FACE) {
                    this._faceSelection = null;
                }
            };
            CuttingPlaneController.prototype._resetCuttingData = function () {
                this._resetAxis(AxisIndex.X);
                this._resetAxis(AxisIndex.Y);
                this._resetAxis(AxisIndex.Z);
                this._resetAxis(AxisIndex.FACE);
                this._useIndividualCuttingSections = true;
                this._showReferenceGeometry = true;
                this._faceSelection = null;
            };
            CuttingPlaneController.prototype.resetCuttingPlanes = function () {
                this._resetCuttingData();
                return this._clearCuttingSections();
            };
            CuttingPlaneController.prototype._initSection = function () {
                var _this = this;
                return this._viewer.model.getModelBounding(true, false).then(function (modelBounding) {
                    _this._modelBounding = modelBounding.copy();
                    var cuttingManager = _this._viewer.cuttingManager;
                    console.assert(cuttingManager._isInitialized());
                    _this._cuttingSections[AxisIndex.X] = cuttingManager.getCuttingSection(AxisIndex.X);
                    _this._cuttingSections[AxisIndex.Y] = cuttingManager.getCuttingSection(AxisIndex.Y);
                    _this._cuttingSections[AxisIndex.Z] = cuttingManager.getCuttingSection(AxisIndex.Z);
                    _this._cuttingSections[AxisIndex.FACE] = cuttingManager.getCuttingSection(AxisIndex.FACE);
                    _this._triggerPendingFuncs();
                });
            };
            CuttingPlaneController.prototype._triggerPendingFuncs = function () {
                if (this._pendingFuncs.inverted) {
                    this._pendingFuncs.inverted();
                    delete this._pendingFuncs.inverted;
                }
                if (this._pendingFuncs.visibility) {
                    this._pendingFuncs.visibility();
                    delete this._pendingFuncs.visibility;
                }
            };
            CuttingPlaneController.prototype.toggle = function (axis) {
                var _this = this;
                var ps = [];
                switch (this._ensurePlaneInfo(axis).status) {
                    case 0 /* Hidden */:
                        if (axis === AxisIndex.FACE) {
                            var selectionItem = this._viewer.selectionManager.getLast();
                            if (selectionItem !== null && selectionItem.isFaceSelection()) {
                                this._faceSelection = selectionItem;
                                // clear any cutting planes in the face cutting section
                                ps.push(this._cuttingSections[axis].clear().then(function () {
                                    _this._setStatus(axis, 1 /* Visible */);
                                    return _this.setCuttingPlaneVisibility(true, axis);
                                }));
                            }
                        }
                        else {
                            this._setStatus(axis, 1 /* Visible */);
                            ps.push(this.setCuttingPlaneVisibility(true, axis));
                        }
                        break;
                    case 1 /* Visible */:
                        this._setStatus(axis, 2 /* Inverted */);
                        ps.push(this.setCuttingPlaneInverted(axis));
                        break;
                    case 2 /* Inverted */:
                        this._setStatus(axis, 0 /* Hidden */);
                        ps.push(this.setCuttingPlaneVisibility(false, axis));
                        break;
                }
                return Communicator.Util.waitForAll(ps);
            };
            CuttingPlaneController.prototype.getCount = function () {
                var count = 0;
                for (var _i = 0, _a = this._cuttingSections; _i < _a.length; _i++) {
                    var section = _a[_i];
                    count += section.getCount();
                }
                return count;
            };
            CuttingPlaneController.prototype.setCuttingPlaneVisibility = function (visibility, axis) {
                var _this = this;
                var index = this._getCuttingSectionIndex(axis);
                var section = this._cuttingSections[index];
                if (section === undefined) {
                    this._pendingFuncs.visibility = function () {
                        _this.setCuttingPlaneVisibility(visibility, axis);
                    };
                    return Promise.resolve();
                }
                this._viewer.delayCapping();
                var p;
                if (visibility) {
                    var planeInfo = this._ensurePlaneInfo(axis);
                    if (planeInfo.plane === null) {
                        planeInfo.plane = this._generateCuttingPlane(axis);
                        planeInfo.referenceGeometry = this._generateReferenceGeometry(axis);
                    }
                    p = this._setSection(axis);
                }
                else {
                    p = this.refreshPlaneGeometry();
                }
                var count = this.getCount();
                var active = this._isActive(axis);
                return p.then(function () {
                    if (count > 0 && !active) {
                        return _this._activatePlanes();
                    }
                    else if (active && count === 0) {
                        return _this._deactivateAxis(axis);
                    }
                    return Promise.resolve();
                });
            };
            CuttingPlaneController.prototype.setCuttingPlaneInverted = function (axis) {
                var _this = this;
                var sectionIndex = this._getCuttingSectionIndex(axis);
                var section = this._cuttingSections[sectionIndex];
                if (section === undefined) {
                    this._pendingFuncs.inverted = function () {
                        _this.setCuttingPlaneInverted(axis);
                    };
                    return Promise.resolve();
                }
                this._viewer.delayCapping();
                var index = this._getPlaneIndex(axis);
                var plane = section.getPlane(index);
                if (plane) {
                    plane.normal.negate();
                    plane.d *= -1;
                    return section.updatePlane(index, plane, new Communicator.Matrix(), false, false);
                }
                return Promise.resolve();
            };
            CuttingPlaneController.prototype.toggleReferenceGeometry = function () {
                if (this.getCount() > 0) {
                    this._showReferenceGeometry = !this._showReferenceGeometry;
                    return this.refreshPlaneGeometry();
                }
                return Promise.resolve();
            };
            CuttingPlaneController.prototype.refreshPlaneGeometry = function () {
                var _this = this;
                this._storePlanes();
                return this._clearCuttingSections().then(function () {
                    return _this._restorePlanes();
                });
            };
            CuttingPlaneController.prototype.toggleCuttingMode = function () {
                var _this = this;
                if (this.getCount() > 1) {
                    this._storePlanes();
                    var p = this._clearCuttingSections();
                    this._useIndividualCuttingSections = !this._useIndividualCuttingSections;
                    return p.then(function () {
                        return _this._restorePlanes();
                    });
                }
                return Promise.resolve();
            };
            /* Helper functions */
            CuttingPlaneController.prototype._isActive = function (axis) {
                return this._cuttingSections[this._getCuttingSectionIndex(axis)].isActive();
            };
            CuttingPlaneController.prototype._deactivateAxis = function (axis) {
                return this._cuttingSections[this._getCuttingSectionIndex(axis)].deactivate();
            };
            CuttingPlaneController.prototype._getCuttingSectionIndex = function (axis) {
                return this._useIndividualCuttingSections ? axis : 0;
            };
            CuttingPlaneController.prototype._clearCuttingSection = function (axis) {
                var section = this._cuttingSections[axis];
                if (section !== undefined) {
                    return section.clear();
                }
                return Promise.resolve();
            };
            CuttingPlaneController.prototype._clearCuttingSections = function () {
                var ps = [];
                ps.push(this._clearCuttingSection(AxisIndex.X));
                ps.push(this._clearCuttingSection(AxisIndex.Y));
                ps.push(this._clearCuttingSection(AxisIndex.Z));
                ps.push(this._clearCuttingSection(AxisIndex.FACE));
                return Communicator.Util.waitForAll(ps);
            };
            CuttingPlaneController.prototype._activatePlane = function (axis) {
                var section = this._cuttingSections[axis];
                if (section.getCount()) {
                    var p = section.activate();
                    if (p === null) {
                        return Promise.resolve();
                    }
                    return p;
                }
                return Promise.resolve();
            };
            CuttingPlaneController.prototype._activatePlanes = function (activeStates) {
                var ps = [];
                if (!activeStates || activeStates[0])
                    ps.push(this._activatePlane(AxisIndex.X));
                if (!activeStates || activeStates[1])
                    ps.push(this._activatePlane(AxisIndex.Y));
                if (!activeStates || activeStates[2])
                    ps.push(this._activatePlane(AxisIndex.Z));
                if (!activeStates || activeStates[3])
                    ps.push(this._activatePlane(AxisIndex.FACE));
                return Communicator.Util.waitForAll(ps);
            };
            CuttingPlaneController.prototype._getPlaneIndex = function (axis) {
                if (this._useIndividualCuttingSections) {
                    var index = this._getCuttingSectionIndex(axis);
                    var section = this._cuttingSections[index];
                    if (section.getPlane(0)) {
                        return 0;
                    }
                }
                else {
                    var section = this._cuttingSections[0];
                    var planeCount = section.getCount();
                    for (var i = 0; i < planeCount; i++) {
                        var plane = section.getPlane(i);
                        var normal = void 0;
                        if (this._faceSelection) {
                            normal = this._faceSelection.getFaceEntity().getNormal();
                        }
                        if (plane) {
                            if ((plane.normal.x && axis === AxisIndex.X) ||
                                (plane.normal.y && axis === AxisIndex.Y) ||
                                (plane.normal.z && axis === AxisIndex.Z) ||
                                (axis === AxisIndex.FACE && normal && plane.normal.equals(normal))) {
                                return i;
                            }
                        }
                    }
                }
                return -1;
            };
            CuttingPlaneController.prototype._setSection = function (axis) {
                var planeInfo = this._planeInfo.get(axis);
                if (planeInfo !== undefined && planeInfo.plane !== null) {
                    var cuttingSection = this._cuttingSections[this._getCuttingSectionIndex(axis)];
                    var referenceGeometry = this._showReferenceGeometry ? planeInfo.referenceGeometry : null;
                    // XXX: Refactor code to not coerce Promise<boolean> to Promise<void>.
                    return cuttingSection.addPlane(planeInfo.plane, referenceGeometry)
                        .then(Communicator.Internal.nop); // coerces Promise<boolean> to Promise<void>
                }
                return Promise.resolve();
            };
            CuttingPlaneController.prototype._restorePlane = function (axis) {
                var planeInfo = this._planeInfo.get(axis);
                if (planeInfo !== undefined && planeInfo.plane !== null && planeInfo.status !== 0 /* Hidden */) {
                    if (planeInfo.referenceGeometry === null || planeInfo.updateReferenceGeometry) {
                        planeInfo.referenceGeometry = this._generateReferenceGeometry(axis);
                    }
                    return this._setSection(axis);
                }
                return Promise.resolve();
            };
            CuttingPlaneController.prototype._restorePlanes = function (activeStates) {
                this._restorePlane(AxisIndex.X);
                this._restorePlane(AxisIndex.Y);
                this._restorePlane(AxisIndex.Z);
                this._restorePlane(AxisIndex.FACE);
                return this._activatePlanes(activeStates);
            };
            CuttingPlaneController.prototype._storePlane = function (axis) {
                var section = this._cuttingSections[this._getCuttingSectionIndex(axis)];
                var planeInfo = this._ensurePlaneInfo(axis);
                planeInfo.plane = null;
                planeInfo.referenceGeometry = null;
                if (section.getCount() > 0 && planeInfo.status !== 0 /* Hidden */) {
                    var planeIndex = this._getPlaneIndex(axis);
                    var plane = section.getPlane(planeIndex);
                    var referenceGeometry = section.getReferenceGeometry(planeIndex);
                    planeInfo.plane = plane;
                    planeInfo.referenceGeometry = referenceGeometry;
                }
            };
            CuttingPlaneController.prototype._storePlanes = function () {
                this._storePlane(AxisIndex.X);
                this._storePlane(AxisIndex.Y);
                this._storePlane(AxisIndex.Z);
                this._storePlane(AxisIndex.FACE);
            };
            CuttingPlaneController.prototype._generateReferenceGeometry = function (axisIndex) {
                var cuttingManager = this._viewer.cuttingManager;
                var referenceGeometry = [];
                var axis;
                if (axisIndex === AxisIndex.FACE) {
                    if (this._faceSelection) {
                        var normal = this._faceSelection.getFaceEntity().getNormal();
                        var position = this._faceSelection.getPosition();
                        referenceGeometry = cuttingManager.createReferenceGeometryFromFaceNormal(normal, position, this._modelBounding);
                    }
                }
                else {
                    switch (axisIndex) {
                        case AxisIndex.X:
                            axis = Communicator.Axis.X;
                            break;
                        case AxisIndex.Y:
                            axis = Communicator.Axis.Y;
                            break;
                        case AxisIndex.Z:
                            axis = Communicator.Axis.Z;
                            break;
                    }
                    if (axis !== undefined) {
                        referenceGeometry = cuttingManager.createReferenceGeometryFromAxis(axis, this._modelBounding);
                    }
                }
                return referenceGeometry;
            };
            CuttingPlaneController.prototype._generateCuttingPlane = function (axis) {
                var plane = new Communicator.Plane();
                switch (axis) {
                    case AxisIndex.X:
                        plane.normal.set(1, 0, 0);
                        plane.d = -this._modelBounding.max.x;
                        break;
                    case AxisIndex.Y:
                        plane.normal.set(0, 1, 0);
                        plane.d = -this._modelBounding.max.y;
                        break;
                    case AxisIndex.Z:
                        plane.normal.set(0, 0, 1);
                        plane.d = -this._modelBounding.max.z;
                        break;
                    case AxisIndex.FACE:
                        if (this._faceSelection) {
                            this._faceSelection = this._faceSelection;
                            var normal = this._faceSelection.getFaceEntity().getNormal();
                            var position = this._faceSelection.getPosition();
                            plane.setFromPointAndNormal(position, normal);
                        }
                        else {
                            return null;
                        }
                }
                return plane;
            };
            return CuttingPlaneController;
        }());
        Ui.CuttingPlaneController = CuttingPlaneController;
    })(Ui = Communicator.Ui || (Communicator.Ui = {}));
})(Communicator || (Communicator = {}));
var Communicator;
(function (Communicator) {
    /**
     * @hidden
     * Removes any ids from the array if they are not contained in the current sheet.
     * @param nodeIds [[NodeId]] array.
     */
    function _filterActiveSheetNodeIds(viewer, nodeIds) {
        var model = viewer.model;
        var activeSheetId = viewer.getActiveSheetId();
        if (activeSheetId !== null) {
            var sheetParent = model.getNodeParent(activeSheetId);
            var sheets_1 = model.getNodeChildren(sheetParent);
            Communicator.Internal.filterInPlace(nodeIds, function (id) {
                var parentId = id;
                while (parentId !== null) {
                    if (parentId === activeSheetId) {
                        return true;
                    }
                    else if (sheets_1.indexOf(parentId) !== -1) {
                        return false;
                    }
                    parentId = viewer.model.getNodeParent(parentId);
                }
                return true;
            });
        }
    }
    Communicator._filterActiveSheetNodeIds = _filterActiveSheetNodeIds;
    var IsolateZoomHelper = /** @class */ (function () {
        function IsolateZoomHelper(viewer) {
            var _this = this;
            this._camera = null;
            this._deselectOnIsolate = true;
            this._deselectOnZoom = true;
            this._isolateStatus = false;
            this._viewer = viewer;
            this._noteTextManager = this._viewer._getNoteTextManager();
            this._viewer.setCallbacks({
                modelSwitched: function () {
                    _this._camera = null;
                }
            });
        }
        IsolateZoomHelper.prototype._setCamera = function (camera) {
            if (this._camera === null) {
                this._camera = camera;
            }
        };
        IsolateZoomHelper.prototype.setDeselectOnIsolate = function (deselect) {
            this._deselectOnIsolate = deselect;
        };
        IsolateZoomHelper.prototype.getIsolateStatus = function () {
            return this._isolateStatus;
        };
        IsolateZoomHelper.prototype.isolateNodes = function (nodeIds, initiallyHiddenStayHidden) {
            if (initiallyHiddenStayHidden === void 0) { initiallyHiddenStayHidden = null; }
            var view = this._viewer.view;
            this._setCamera(view.getCamera());
            _filterActiveSheetNodeIds(this._viewer, nodeIds);
            var p = view.isolateNodes(nodeIds, Communicator.DefaultTransitionDuration, !this._viewer.model.isDrawing(), initiallyHiddenStayHidden);
            if (this._deselectOnIsolate) {
                this._viewer.selectionManager.clear();
            }
            this._isolateStatus = true;
            return p;
        };
        IsolateZoomHelper.prototype.fitNodes = function (nodeIds) {
            var view = this._viewer.view;
            this._setCamera(view.getCamera());
            var p = view.fitNodes(nodeIds);
            if (this._deselectOnZoom) {
                this._viewer.selectionManager.clear();
            }
            return p;
        };
        IsolateZoomHelper.prototype.showAll = function () {
            var model = this._viewer.model;
            if (this._viewer.isDrawingSheetActive()) {
                var sheetId = this._viewer.getActiveSheetId();
                if (sheetId !== null) {
                    return this.isolateNodes([sheetId]);
                }
                return Promise.resolve();
            }
            else {
                var ps = [];
                if (model.isDrawing()) {
                    // Need to reset 3DNodes here
                    var nodes3D = this._viewer._getSheetManager().get3DNodes();
                    ps.push(this.isolateNodes(nodes3D));
                }
                else
                    ps.push(model.resetNodesVisibility());
                if (this._camera !== null) {
                    this._viewer.view.setCamera(this._camera, Communicator.DefaultTransitionDuration);
                    this._camera = null;
                }
                this._isolateStatus = false;
                ps.push(this._updatePinVisibility());
                return Communicator.Util.waitForAll(ps);
            }
        };
        IsolateZoomHelper.prototype._updatePinVisibility = function () {
            this._noteTextManager.setIsolateActive(this._isolateStatus);
            return this._noteTextManager.updatePinVisibility();
        };
        return IsolateZoomHelper;
    }());
    Communicator.IsolateZoomHelper = IsolateZoomHelper;
})(Communicator || (Communicator = {}));
var Example;
(function (Example) {
    var PulseInfo = /** @class */ (function () {
        function PulseInfo(id, color1, color2, duration) {
            this.direction = 0 /* OneToTwo */;
            this.progress = 0;
            this.id = id;
            this.color1 = color1.copy();
            this.color2 = color2.copy();
            this.duration = duration;
        }
        return PulseInfo;
    }());
    var PulseManager = /** @class */ (function () {
        function PulseManager(viewer) {
            this._pulseInfoMap = {};
            this._defaultColor1 = Communicator.Color.red();
            this._defaultColor2 = new Communicator.Color(175, 0, 0);
            this._defaultPulseTime = 1000;
            this._viewer = viewer;
        }
        PulseManager.prototype.start = function () {
            var _this = this;
            setTimeout(function () {
                _this.update();
            }, 30);
        };
        PulseManager.prototype.deletePulse = function (id) {
            if (this._pulseInfoMap.hasOwnProperty(id.toString())) {
                this._viewer.getModel().unsetNodesFaceColor([id]);
                delete this._pulseInfoMap[id];
            }
        };
        PulseManager.prototype.add = function (id, color1, color2, duration) {
            this.deletePulse(id);
            var pulseInfo = new PulseInfo(id, color1, color2, duration);
            this._pulseInfoMap[id] = pulseInfo;
        };
        PulseManager.prototype.update = function () {
            if (this._previousTime == null) {
                this._previousTime = Date.now();
            }
            var currentTime = Date.now();
            var timeDelta = currentTime - this._previousTime;
            var colorMap = {};
            var itemsPresent = false;
            for (var _i = 0, _a = Object.keys(this._pulseInfoMap); _i < _a.length; _i++) {
                var key_2 = _a[_i];
                var pulseInfo = this._pulseInfoMap[key_2];
                itemsPresent = true;
                pulseInfo.progress = Math.min(pulseInfo.progress + timeDelta, pulseInfo.duration);
                var t = pulseInfo.progress / pulseInfo.duration;
                var a = void 0;
                var b = void 0;
                if (pulseInfo.direction === 0 /* OneToTwo */) {
                    a = pulseInfo.color1;
                    b = pulseInfo.color2;
                }
                else {
                    a = pulseInfo.color2;
                    b = pulseInfo.color1;
                }
                var interpolatedColor = new Communicator.Color(a.r + (b.r - a.r) * t, a.g + (b.g - a.g) * t, a.b + (b.b - a.b) * t);
                colorMap[pulseInfo.id] = interpolatedColor;
                if (pulseInfo.progress >= pulseInfo.duration) {
                    pulseInfo.direction = (pulseInfo.direction === 0 /* OneToTwo */) ? 1 /* TwoToOne */ : 0 /* OneToTwo */;
                    pulseInfo.progress = 0;
                }
            }
            if (itemsPresent) {
                this._viewer.getModel().setNodesColors(colorMap);
                this._viewer.redraw();
            }
            this._previousTime = currentTime;
            this.start();
        };
        PulseManager.prototype.getDefaultColor1 = function () {
            return this._defaultColor1.copy();
        };
        PulseManager.prototype.getDefaultColor2 = function () {
            return this._defaultColor2.copy();
        };
        PulseManager.prototype.getDefaultPulseTime = function () {
            return this._defaultPulseTime;
        };
        return PulseManager;
    }());
    Example.PulseManager = PulseManager;
})(Example || (Example = {}));
var Communicator;
(function (Communicator) {
    var Ui;
    (function (Ui) {
        var RightClickContextMenu = /** @class */ (function (_super) {
            __extends(RightClickContextMenu, _super);
            function RightClickContextMenu(containerId, viewer, isolateZoomHelper) {
                var _this = _super.call(this, "rightclick", containerId, viewer, isolateZoomHelper) || this;
                _this._initEvents();
                return _this;
            }
            RightClickContextMenu.prototype._initEvents = function () {
                var _this = this;
                this._viewer.setCallbacks({
                    contextMenu: function (position, modifiers) {
                        _this._modifiers = modifiers;
                        _this.doContext(position);
                    }
                });
            };
            RightClickContextMenu.prototype.doContext = function (position) {
                var _this = this;
                var config = new Communicator.PickConfig(Communicator.SelectionMask.All);
                return this._viewer.view.pickFromPoint(position, config).then(function (selectionItem) {
                    var axisOverlay = 1;
                    var nodeType;
                    if (selectionItem.isNodeSelection()) {
                        nodeType = _this._viewer.model.getNodeType(selectionItem.getNodeId());
                    }
                    if (nodeType === undefined || nodeType === Communicator.NodeType.Pmi || nodeType === Communicator.NodeType.PmiBody || selectionItem.overlayIndex() === axisOverlay) {
                        _this.setActiveItemId(null);
                    }
                    else {
                        _this.setActiveItemId(selectionItem.getNodeId());
                    }
                    _this._position = selectionItem.getPosition();
                    _this.showElements(position);
                });
            };
            RightClickContextMenu.prototype._onContextLayerClick = function (event) {
                if (event.button === 2)
                    this.doContext(new Communicator.Point2(event.pageX, event.pageY));
                else
                    _super.prototype._onContextLayerClick.call(this, event);
            };
            return RightClickContextMenu;
        }(Ui.Context.ContextMenu));
        Ui.RightClickContextMenu = RightClickContextMenu;
    })(Ui = Communicator.Ui || (Communicator.Ui = {}));
})(Communicator || (Communicator = {}));
/// <reference path="../js/hoops_web_viewer.d.ts"/>
var Communicator;
(function (Communicator) {
    var Ui;
    (function (Ui) {
        var StreamingIndicator = /** @class */ (function () {
            function StreamingIndicator(elementId, viewer) {
                var _this = this;
                this._bottomLeftOffset = new Communicator.Point2(10, 10);
                this._opacity = 0.5;
                this._spinnerImageUrl = "css/images/spinner.gif";
                this._spinnerSize = new Communicator.Point2(31, 31);
                this._viewer = viewer;
                this._container = document.getElementById(elementId);
                this._initContainer();
                this._viewer.setCallbacks({
                    streamingActivated: function () { _this._onStreamingActivated(); },
                    streamingDeactivated: function () { _this._onStreamingDeactivated(); },
                    _shutdownBegin: function () { _this._onStreamingDeactivated(); },
                });
            }
            StreamingIndicator.prototype.show = function () {
                this._container.style.display = "block";
            };
            StreamingIndicator.prototype.hide = function () {
                this._container.style.display = "none";
            };
            StreamingIndicator.prototype.setBottomLeftOffset = function (point) {
                this._bottomLeftOffset.assign(point);
                this._container.style.left = this._bottomLeftOffset.x + "px";
                this._container.style.bottom = this._bottomLeftOffset.y + "px";
            };
            StreamingIndicator.prototype.getBottomLeftOffset = function () {
                return this._bottomLeftOffset.copy();
            };
            StreamingIndicator.prototype.setSpinnerImage = function (spinnerUrl, size) {
                this._spinnerImageUrl = spinnerUrl;
                this._spinnerSize.assign(size);
                this._container.style.backgroundImage = "url(" + this._spinnerImageUrl + ")";
                this._container.style.width = this._spinnerSize.x + "px";
                this._container.style.height = this._spinnerSize.y + "\"px";
            };
            StreamingIndicator.prototype._initContainer = function () {
                this._container.style.position = "absolute";
                this._container.style.width = this._spinnerSize.x + "px";
                this._container.style.height = this._spinnerSize.y + "px";
                this._container.style.left = this._bottomLeftOffset.x + "px";
                this._container.style.bottom = this._bottomLeftOffset.y + "px";
                this._container.style.backgroundImage = "url(" + this._spinnerImageUrl + ")";
                this._container.style.opacity = "" + this._opacity;
            };
            StreamingIndicator.prototype._onStreamingActivated = function () {
                this.show();
            };
            StreamingIndicator.prototype._onStreamingDeactivated = function () {
                this.hide();
            };
            return StreamingIndicator;
        }());
        Ui.StreamingIndicator = StreamingIndicator;
    })(Ui = Communicator.Ui || (Communicator.Ui = {}));
})(Communicator || (Communicator = {}));
var Communicator;
(function (Communicator) {
    var Ui;
    (function (Ui) {
        var UiDialog = /** @class */ (function () {
            function UiDialog(containerId) {
                this._containerId = containerId;
                this._textDiv = UiDialog._createTextDiv();
                this._windowElement = UiDialog._createWindowElement();
                this._headerDiv = UiDialog._createHeaderDiv();
                this._initElements();
            }
            UiDialog._createWindowElement = function () {
                var windowElement = document.createElement("div");
                windowElement.classList.add("ui-timeout-window");
                windowElement.classList.add("desktop-ui-window");
                return windowElement;
            };
            UiDialog._createHeaderDiv = function () {
                var headerDiv = document.createElement("div");
                headerDiv.classList.add("desktop-ui-window-header");
                return headerDiv;
            };
            UiDialog._createTextDiv = function () {
                var textDiv = document.createElement("div");
                return textDiv;
            };
            UiDialog.prototype._initElements = function () {
                var _this = this;
                var contentDiv = document.createElement("div");
                contentDiv.classList.add("desktop-ui-window-content");
                contentDiv.appendChild(this._textDiv);
                var br = document.createElement("div");
                br.classList.add("desktop-ui-window-divider");
                contentDiv.appendChild(br);
                var button = document.createElement("button");
                button.innerHTML = "Ok";
                $(button).button().click(function () {
                    _this._onOkButtonClick();
                });
                contentDiv.appendChild(button);
                this._windowElement.appendChild(this._headerDiv);
                this._windowElement.appendChild(contentDiv);
                var container = document.getElementById(this._containerId);
                if (container !== null) {
                    container.appendChild(this._windowElement);
                }
            };
            UiDialog.prototype._onOkButtonClick = function () {
                this.hide();
            };
            UiDialog.prototype.show = function () {
                $(this._windowElement).show();
            };
            UiDialog.prototype.hide = function () {
                $(this._windowElement).hide();
            };
            UiDialog.prototype.setText = function (text) {
                $(this._textDiv).empty();
                this._textDiv.appendChild(document.createTextNode(text));
            };
            UiDialog.prototype.setTitle = function (title) {
                $(this._headerDiv).empty();
                this._headerDiv.appendChild(document.createTextNode(title));
            };
            return UiDialog;
        }());
        Ui.UiDialog = UiDialog;
    })(Ui = Communicator.Ui || (Communicator.Ui = {}));
})(Communicator || (Communicator = {}));
/// <reference path="UiDialog.ts"/>
var Communicator;
(function (Communicator) {
    var Ui;
    (function (Ui) {
        var TimeoutWarningDialog = /** @class */ (function (_super) {
            __extends(TimeoutWarningDialog, _super);
            function TimeoutWarningDialog(containerId, viewer) {
                var _this = _super.call(this, containerId) || this;
                _this._viewer = viewer;
                _this._viewer.setCallbacks({
                    timeoutWarning: function () {
                        _this._onTimeoutWarning();
                    },
                    timeout: function () {
                        _this._onTimeout();
                    }
                });
                _this.setTitle("Timeout Warning");
                return _this;
            }
            TimeoutWarningDialog.prototype._onTimeoutWarning = function () {
                this.setText("Your session will expire soon. Press Ok to stay connected.");
                this.show();
            };
            TimeoutWarningDialog.prototype._onOkButtonClick = function () {
                this._viewer.resetClientTimeout();
                _super.prototype._onOkButtonClick.call(this);
            };
            TimeoutWarningDialog.prototype._onTimeout = function () {
                this.setText("Your session has been disconnected due to inactivity.");
                this.show();
            };
            return TimeoutWarningDialog;
        }(Ui.UiDialog));
        Ui.TimeoutWarningDialog = TimeoutWarningDialog;
    })(Ui = Communicator.Ui || (Communicator.Ui = {}));
})(Communicator || (Communicator = {}));
/// <reference path="../js/hoops_web_viewer.d.ts"/>
var Communicator;
(function (Communicator) {
    var Ui;
    (function (Ui) {
        var Toolbar = /** @class */ (function () {
            function Toolbar(viewer, cuttingPlaneController, screenConfiguration) {
                if (screenConfiguration === void 0) { screenConfiguration = Communicator.ScreenConfiguration.Desktop; }
                var _this = this;
                this._toolbarSelector = "#toolBar";
                this._screenElementSelector = "#content";
                this._cuttingPlaneXSelector = "#cuttingplane-x";
                this._cuttingPlaneYSelector = "#cuttingplane-y";
                this._cuttingPlaneZSelector = "#cuttingplane-z";
                this._cuttingPlaneFaceSelector = "#cuttingplane-face";
                this._cuttingPlaneVisibilitySelector = "#cuttingplane-section";
                this._cuttingPlaneGroupToggle = "#cuttingplane-toggle";
                this._cuttingPlaneResetSelector = "#cuttingplane-reset";
                this._selectedClass = "selected";
                this._disabledClass = "disabled";
                this._invertedClass = "inverted";
                this._submenuHeightOffset = 10;
                this._viewOrientationDuration = 500;
                this._activeSubmenu = null;
                this._actionsNullary = new Map();
                this._actionsBoolean = new Map();
                this._isInitialized = false;
                this._viewer = viewer;
                this._noteTextManager = this._viewer._getNoteTextManager();
                this._screenConfiguration = screenConfiguration;
                this._cuttingPlaneController = cuttingPlaneController;
                this._viewerSettings = new Ui.Desktop.ViewerSettings(viewer);
                this._viewer.setCallbacks({
                    selectionArray: function (events) {
                        if (events.length > 0) {
                            var selection = events[events.length - 1];
                            var selectionItem = selection.getSelection();
                            if (selectionItem !== null && selectionItem.isFaceSelection()) {
                                $(_this._cuttingPlaneFaceSelector).removeClass(_this._disabledClass);
                                $("#view-face").removeClass(_this._disabledClass);
                            }
                        }
                        else {
                            $(_this._cuttingPlaneFaceSelector).addClass(_this._disabledClass);
                            $("#view-face").addClass(_this._disabledClass);
                        }
                    },
                    _cuttingSectionsLoaded: function () {
                        return _this._cuttingPlaneController.onSectionsChanged().then(function () {
                            _this._updateCuttingPlaneIcons();
                        });
                    },
                });
            }
            Toolbar.prototype.init = function () {
                var _this = this;
                if (this._isInitialized)
                    return;
                this._initIcons();
                this._removeNonApplicableIcons();
                $(".hoops-tool").on("click", function (event) {
                    event.preventDefault();
                    _this._processButtonClick(event);
                    return false;
                });
                $(".submenu-icon").on("click", function (event) {
                    event.preventDefault();
                    _this._submenuIconClick(event.target);
                    return false;
                });
                $(this._toolbarSelector).on("touchmove", function (event) {
                    event.originalEvent.preventDefault();
                });
                $(this._toolbarSelector).on("mouseenter", function () {
                    _this._mouseEnter();
                });
                $(this._toolbarSelector).on("mouseleave", function () {
                    _this._mouseLeave();
                });
                $(".tool-icon, .submenu-icon").on("mouseenter", function (event) {
                    _this._mouseEnterItem(event);
                });
                $(".tool-icon, .submenu-icon").on("mouseleave", function (event) {
                    _this._mouseLeaveItem(event);
                });
                $(window).resize(function () {
                    _this.reposition();
                });
                $(this._toolbarSelector).click(function () {
                    if (_this._activeSubmenu !== null) {
                        _this._hideActiveSubmenu();
                    }
                });
                $(".toolbar-cp-plane").click(function (event) {
                    _this._cuttingPlaneButtonClick(event);
                });
                this._viewer.setCallbacks({
                    modelSwitched: function () {
                        _this._hideActiveSubmenu();
                    }
                });
                this._initSliders();
                this._initActions();
                this._initSnapshot();
                this.updateEdgeFaceButton();
                this.reposition();
                this.show();
                this._isInitialized = true;
            };
            /** @hidden */
            Toolbar.prototype._getViewerSettings = function () {
                return this._viewerSettings;
            };
            Toolbar.prototype.disableSubmenuItem = function (item) {
                var _this = this;
                if (typeof item === "string") {
                    $("#submenus .toolbar-" + item).addClass(this._disabledClass);
                }
                else if (typeof item === "object") {
                    $.each(item, function (key, value) {
                        key;
                        $("#submenus .toolbar-" + value).addClass(_this._disabledClass);
                    });
                }
            };
            Toolbar.prototype.enableSubmenuItem = function (item) {
                var _this = this;
                if (typeof item === "string") {
                    $("#submenus .toolbar-" + item).removeClass(this._disabledClass);
                }
                else if (typeof item === "object") {
                    $.each(item, function (key, value) {
                        key;
                        $("#submenus .toolbar-" + value).removeClass(_this._disabledClass);
                    });
                }
            };
            Toolbar.prototype.setCorrespondingButtonForSubmenuItem = function (value) {
                var $item = $("#submenus .toolbar-" + value);
                this._activateSubmenuItem($item);
            };
            Toolbar.prototype._mouseEnterItem = function (event) {
                var $target = $(event.target);
                if (!$target.hasClass(this._disabledClass))
                    $target.addClass("hover");
            };
            Toolbar.prototype._mouseLeaveItem = function (event) {
                $(event.target).removeClass("hover");
            };
            Toolbar.prototype.show = function () {
                $(this._toolbarSelector).show();
            };
            Toolbar.prototype.hide = function () {
                $(this._toolbarSelector).hide();
            };
            Toolbar.prototype._initSliders = function () {
                var _this = this;
                $("#explosion-slider").slider({
                    orientation: "vertical",
                    min: 0,
                    max: 200,
                    value: 0,
                    slide: function (event, ui) {
                        event;
                        _this._onExplosionSlider((ui.value || 0) / 100);
                    },
                });
            };
            Toolbar.prototype._mouseEnter = function () {
                if (this._activeSubmenu === null) {
                    var $tools = $(this._toolbarSelector).find(".toolbar-tools");
                    $tools.stop();
                    $tools.css({
                        opacity: 1.0
                    });
                }
            };
            Toolbar.prototype._mouseLeave = function () {
                if (this._activeSubmenu === null) {
                    $(".toolbar-tools").animate({
                        opacity: 0.6,
                    }, 500, function () {
                        // Animation complete.
                    });
                }
            };
            Toolbar.prototype.reposition = function () {
                var $toolbar = $(this._toolbarSelector);
                var $screen = $(this._screenElementSelector);
                if ($toolbar !== undefined && $screen !== undefined) {
                    var screenWidth = $screen.width();
                    var toolbarWidth = $toolbar.width();
                    if (toolbarWidth !== undefined && screenWidth !== undefined) {
                        var canvasCenterX = screenWidth / 2;
                        var toolbarX = canvasCenterX - (toolbarWidth / 2);
                        $toolbar.css({
                            left: toolbarX + "px",
                            bottom: "15px"
                        });
                    }
                }
            };
            Toolbar.prototype._processButtonClick = function (event) {
                if (this._activeSubmenu !== null) {
                    this._hideActiveSubmenu();
                }
                else {
                    if (event !== null) {
                        var target = event.target;
                        var $tool = $(target).closest(".hoops-tool");
                        if ($tool.hasClass("toolbar-radio")) {
                            if ($tool.hasClass("active-tool")) {
                                this._showSubmenu(target);
                            }
                            else {
                                $(this._toolbarSelector).find(".active-tool").removeClass("active-tool");
                                $tool.addClass("active-tool");
                                this._performNullaryAction($tool.data("operatorclass"));
                            }
                        }
                        else if ($tool.hasClass("toolbar-menu")) {
                            this._showSubmenu(target);
                        }
                        else if ($tool.hasClass("toolbar-menu-toggle")) {
                            this._toggleMenuTool($tool);
                        }
                        else {
                            this._performNullaryAction($tool.data("operatorclass"));
                        }
                    }
                }
            };
            Toolbar.prototype._toggleMenuTool = function ($tool) {
                var $toggleMenu = $("#" + $tool.data("submenu"));
                if ($toggleMenu.is(":visible")) {
                    $toggleMenu.hide();
                    this._performBooleanAction($tool.data("operatorclass"), false);
                }
                else {
                    this._alignMenuToTool($toggleMenu, $tool);
                    this._performBooleanAction($tool.data("operatorclass"), true);
                }
            };
            Toolbar.prototype._startModal = function () {
                var _this = this;
                $("body").append("<div id='toolbar-modal' class='toolbar-modal-overlay'></div>");
                $("#toolbar-modal").bind("click", function () {
                    _this._hideActiveSubmenu();
                });
            };
            Toolbar.prototype._alignMenuToTool = function ($submenu, $tool) {
                var position = $tool.position();
                var leftPositionOffset = position.left;
                if (this._screenConfiguration === Communicator.ScreenConfiguration.Mobile) {
                    // constant scale transform from Toolbar.css
                    var mobileScale = 1.74;
                    leftPositionOffset = leftPositionOffset / mobileScale;
                }
                var submenuWidth = $submenu.width();
                var submenuHeight = $submenu.height();
                if (submenuWidth !== undefined && submenuHeight !== undefined) {
                    var leftpos = leftPositionOffset - (submenuWidth / 2) + 20;
                    var topPos = -(this._submenuHeightOffset + submenuHeight);
                    $submenu.css({
                        display: "block",
                        left: leftpos + "px",
                        top: topPos + "px",
                    });
                }
            };
            Toolbar.prototype._showSubmenu = function (item) {
                this._hideActiveSubmenu();
                var $tool = $(item).closest(".hoops-tool");
                var submenuId = $tool.data("submenu");
                if (!!submenuId) {
                    var $submenu = $(this._toolbarSelector + " #submenus #" + submenuId);
                    if (!$submenu.hasClass(this._disabledClass)) {
                        this._alignMenuToTool($submenu, $tool);
                        this._activeSubmenu = $submenu[0];
                        this._startModal();
                        $(this._toolbarSelector).find(".toolbar-tools").css({
                            opacity: 0.3
                        });
                    }
                }
            };
            Toolbar.prototype._hideActiveSubmenu = function () {
                $("#toolbar-modal").remove();
                if (this._activeSubmenu !== null) {
                    $(this._activeSubmenu).hide();
                    $(this._toolbarSelector).find(".toolbar-tools").css({
                        opacity: 1.0
                    });
                }
                this._activeSubmenu = null;
            };
            Toolbar.prototype._activateSubmenuItem = function (submenuItem) {
                var $submenu = submenuItem.closest(".toolbar-submenu");
                var action = submenuItem.data("operatorclass");
                if (typeof action !== "string") {
                    throw new Communicator.CommunicatorError("Invalid submenuItem.");
                }
                var $tool = $("#" + $submenu.data("button"));
                var $icon = $tool.find(".tool-icon");
                if ($icon.length) {
                    $icon.removeClass($tool.data("operatorclass").toString());
                    $icon.addClass(action);
                    $tool.data("operatorclass", action);
                    var title = submenuItem.attr("title");
                    if (title !== undefined) {
                        $tool.attr("title", title);
                    }
                }
                return action;
            };
            Toolbar.prototype._submenuIconClick = function (item) {
                var $selection = $(item);
                if ($selection.hasClass(this._disabledClass))
                    return;
                var action = this._activateSubmenuItem($selection);
                this._hideActiveSubmenu();
                this._performNullaryAction(action);
            };
            Toolbar.prototype._initIcons = function () {
                $(this._toolbarSelector).find(".hoops-tool").each(function () {
                    var $element = $(this);
                    $element.find(".tool-icon").addClass($element.data("operatorclass").toString());
                });
                $(this._toolbarSelector).find(".submenu-icon").each(function () {
                    var $element = $(this);
                    $element.addClass($element.data("operatorclass").toString());
                });
            };
            Toolbar.prototype._removeNonApplicableIcons = function () {
                if (this._screenConfiguration === Communicator.ScreenConfiguration.Mobile) {
                    $("#snapshot-button").remove();
                }
            };
            Toolbar.prototype.setSubmenuEnabled = function (buttonId, enabled) {
                var $button = $("#" + buttonId);
                var $submenu = $("#" + $button.data("submenu"));
                if (enabled) {
                    $button.find(".smarrow").show();
                    $submenu.removeClass(this._disabledClass);
                }
                else {
                    $button.find(".smarrow").hide();
                    $submenu.addClass(this._disabledClass);
                }
            };
            Toolbar.prototype._performNullaryAction = function (action) {
                var func = this._actionsNullary.get(action);
                if (func) {
                    func();
                }
            };
            Toolbar.prototype._performBooleanAction = function (action, arg) {
                var func = this._actionsBoolean.get(action);
                if (func) {
                    func(arg);
                }
            };
            Toolbar.prototype._renderModeClick = function (action) {
                var view = this._viewer.view;
                switch (action) {
                    case "toolbar-shaded":
                        return view.setDrawMode(Communicator.DrawMode.Shaded);
                    case "toolbar-wireframe":
                        return view.setDrawMode(Communicator.DrawMode.Wireframe);
                    case "toolbar-hidden-line":
                        return view.setDrawMode(Communicator.DrawMode.HiddenLine);
                    case "toolbar-xray":
                        return view.setDrawMode(Communicator.DrawMode.XRay);
                    default:
                    case "toolbar-wireframeshaded":
                        return view.setDrawMode(Communicator.DrawMode.WireframeOnShaded);
                }
            };
            Toolbar.prototype._initSnapshot = function () {
                $("#snapshot-dialog-cancel-button").button().click(function () {
                    $("#snapshot-dialog").hide();
                });
            };
            Toolbar.prototype._doSnapshot = function () {
                return __awaiter(this, void 0, void 0, function () {
                    var canvasSize, windowAspect, renderHeight, renderWidth, $screen, windowWidth, windowHeight, percentageOfWindow, dialogWidth, config, image, xpos, $dialog;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0:
                                canvasSize = this._viewer.view.getCanvasSize();
                                windowAspect = canvasSize.x / canvasSize.y;
                                renderHeight = 480;
                                renderWidth = windowAspect * renderHeight;
                                $screen = $("#content");
                                windowWidth = $screen.width();
                                windowHeight = $screen.height();
                                percentageOfWindow = .7;
                                if (!(windowHeight !== undefined && windowWidth !== undefined)) return [3 /*break*/, 2];
                                renderHeight = windowHeight * percentageOfWindow;
                                renderWidth = windowWidth * percentageOfWindow;
                                dialogWidth = renderWidth + 40;
                                config = new Communicator.SnapshotConfig(canvasSize.x, canvasSize.y);
                                return [4 /*yield*/, this._viewer.takeSnapshot(config)];
                            case 1:
                                image = _a.sent();
                                xpos = (windowWidth - renderWidth) / 2;
                                $dialog = $("#snapshot-dialog");
                                $("#snapshot-dialog-image").attr("src", image.src).attr("width", dialogWidth).attr("height", renderHeight + 40);
                                $dialog.css({
                                    top: "45px",
                                    left: xpos + "px",
                                });
                                $dialog.show();
                                _a.label = 2;
                            case 2: return [2 /*return*/];
                        }
                    });
                });
            };
            Toolbar.prototype._setRedlineOperator = function (operatorId) {
                this._viewer.operatorManager.set(operatorId, 1);
            };
            Toolbar.prototype._initActions = function () {
                var _this = this;
                var view = this._viewer.view;
                var operatorManager = this._viewer.operatorManager;
                this._actionsNullary.set("toolbar-home", function () {
                    if (_this._viewer.isDrawingSheetActive()) {
                        var sheetId = _this._viewer.getActiveSheetId();
                        if (sheetId !== null) {
                            view.isolateNodes([sheetId]);
                        }
                    }
                    else {
                        _this._viewer.reset();
                        _this._noteTextManager.setIsolateActive(false);
                        _this._noteTextManager.updatePinVisibility();
                        var handleOperator = operatorManager.getOperator(Communicator.OperatorId.Handle);
                        if (handleOperator !== null && handleOperator.removeHandles) {
                            handleOperator.removeHandles();
                        }
                    }
                });
                this._actionsNullary.set("toolbar-redline-circle", function () {
                    _this._setRedlineOperator(Communicator.OperatorId.RedlineCircle);
                });
                this._actionsNullary.set("toolbar-redline-freehand", function () {
                    _this._setRedlineOperator(Communicator.OperatorId.RedlinePolyline);
                });
                this._actionsNullary.set("toolbar-redline-rectangle", function () {
                    _this._setRedlineOperator(Communicator.OperatorId.RedlineRectangle);
                });
                this._actionsNullary.set("toolbar-redline-note", function () {
                    _this._setRedlineOperator(Communicator.OperatorId.RedlineText);
                });
                this._actionsNullary.set("toolbar-note", function () {
                    operatorManager.set(Communicator.OperatorId.Note, 1);
                });
                this._actionsNullary.set("toolbar-select", function () {
                    operatorManager.set(Communicator.OperatorId.Select, 1);
                });
                this._actionsNullary.set("toolbar-area-select", function () {
                    operatorManager.set(Communicator.OperatorId.AreaSelect, 1);
                });
                this._actionsNullary.set("toolbar-orbit", function () {
                    operatorManager.set(Communicator.OperatorId.Navigate, 0);
                });
                this._actionsNullary.set("toolbar-turntable", function () {
                    operatorManager.set(Communicator.OperatorId.Turntable, 0);
                });
                this._actionsNullary.set("toolbar-walk", function () {
                    operatorManager.set(Communicator.OperatorId.WalkMode, 0);
                });
                this._actionsNullary.set("toolbar-face", function () {
                    _this._orientToFace();
                });
                this._actionsNullary.set("toolbar-measure-point", function () {
                    operatorManager.set(Communicator.OperatorId.MeasurePointPointDistance, 1);
                });
                this._actionsNullary.set("toolbar-measure-edge", function () {
                    operatorManager.set(Communicator.OperatorId.MeasureEdgeLength, 1);
                });
                this._actionsNullary.set("toolbar-measure-distance", function () {
                    operatorManager.set(Communicator.OperatorId.MeasureFaceFaceDistance, 1);
                });
                this._actionsNullary.set("toolbar-measure-angle", function () {
                    operatorManager.set(Communicator.OperatorId.MeasureFaceFaceAngle, 1);
                });
                this._actionsNullary.set("toolbar-cuttingplane", function () {
                    return;
                });
                this._actionsBoolean.set("toolbar-explode", function (visibility) {
                    _this._explosionButtonClick(visibility);
                });
                this._actionsNullary.set("toolbar-settings", function () {
                    _this._settingsButtonClick();
                });
                this._actionsNullary.set("toolbar-wireframeshaded", function () {
                    _this._renderModeClick("toolbar-wireframeshaded");
                });
                this._actionsNullary.set("toolbar-shaded", function () {
                    _this._renderModeClick("toolbar-shaded");
                });
                this._actionsNullary.set("toolbar-wireframe", function () {
                    _this._renderModeClick("toolbar-wireframe");
                });
                this._actionsNullary.set("toolbar-hidden-line", function () {
                    _this._renderModeClick("toolbar-hidden-line");
                });
                this._actionsNullary.set("toolbar-xray", function () {
                    _this._renderModeClick("toolbar-xray");
                });
                this._actionsNullary.set("toolbar-front", function () {
                    view.setViewOrientation(Communicator.ViewOrientation.Front, _this._viewOrientationDuration);
                });
                this._actionsNullary.set("toolbar-back", function () {
                    view.setViewOrientation(Communicator.ViewOrientation.Back, _this._viewOrientationDuration);
                });
                this._actionsNullary.set("toolbar-left", function () {
                    view.setViewOrientation(Communicator.ViewOrientation.Left, _this._viewOrientationDuration);
                });
                this._actionsNullary.set("toolbar-right", function () {
                    view.setViewOrientation(Communicator.ViewOrientation.Right, _this._viewOrientationDuration);
                });
                this._actionsNullary.set("toolbar-bottom", function () {
                    view.setViewOrientation(Communicator.ViewOrientation.Bottom, _this._viewOrientationDuration);
                });
                this._actionsNullary.set("toolbar-top", function () {
                    view.setViewOrientation(Communicator.ViewOrientation.Top, _this._viewOrientationDuration);
                });
                this._actionsNullary.set("toolbar-iso", function () {
                    view.setViewOrientation(Communicator.ViewOrientation.Iso, _this._viewOrientationDuration);
                });
                this._actionsNullary.set("toolbar-ortho", function () {
                    view.setProjectionMode(Communicator.Projection.Orthographic);
                });
                this._actionsNullary.set("toolbar-persp", function () {
                    view.setProjectionMode(Communicator.Projection.Perspective);
                });
                this._actionsNullary.set("toolbar-snapshot", function () {
                    _this._doSnapshot();
                });
            };
            Toolbar.prototype._onExplosionSlider = function (value) {
                return this._viewer.explodeManager.setMagnitude(value);
            };
            Toolbar.prototype._explosionButtonClick = function (visibility) {
                var explodeManager = this._viewer.explodeManager;
                if (visibility && !explodeManager.getActive()) {
                    return explodeManager.start();
                }
                return Promise.resolve();
            };
            Toolbar.prototype._settingsButtonClick = function () {
                return this._viewerSettings.show();
            };
            Toolbar.prototype.updateEdgeFaceButton = function () {
                var view = this._viewer.view;
                var edgeVisibility = view.getLineVisibility();
                var faceVisibility = view.getFaceVisibility();
                if (edgeVisibility && faceVisibility)
                    this.setCorrespondingButtonForSubmenuItem("wireframeshaded");
                else if (!edgeVisibility && faceVisibility)
                    this.setCorrespondingButtonForSubmenuItem("shaded");
                else
                    this.setCorrespondingButtonForSubmenuItem("wireframe");
            };
            Toolbar.prototype._cuttingPlaneButtonClick = function (event) {
                var _this = this;
                var $element = $(event.target).closest(".toolbar-cp-plane");
                var planeAction = $element.data("plane");
                var p;
                var axis = this._getAxis(planeAction);
                if (axis !== null) {
                    p = this._cuttingPlaneController.toggle(axis);
                }
                else if (planeAction === "section") {
                    p = this._cuttingPlaneController.toggleReferenceGeometry();
                }
                else if (planeAction === "toggle") {
                    p = this._cuttingPlaneController.toggleCuttingMode();
                }
                else if (planeAction === "reset") {
                    p = this._cuttingPlaneController.resetCuttingPlanes();
                }
                else {
                    p = Promise.resolve();
                }
                return p.then(function () {
                    _this._updateCuttingPlaneIcons();
                });
            };
            Toolbar.prototype._getAxis = function (planeAxis) {
                switch (planeAxis) {
                    case 'x':
                        return Ui.AxisIndex.X;
                    case 'y':
                        return Ui.AxisIndex.Y;
                    case 'z':
                        return Ui.AxisIndex.Z;
                    case 'face':
                        return Ui.AxisIndex.FACE;
                    default:
                        return null;
                }
            };
            Toolbar.prototype._updateCuttingPlaneIcons = function () {
                var geometryEnabled = this._cuttingPlaneController.getReferenceGeometryEnabled();
                var individualCuttingSection = this._cuttingPlaneController.getIndividualCuttingSectionEnabled();
                var count = this._cuttingPlaneController.getCount();
                this._updateCuttingPlaneIcon(Ui.AxisIndex.X, this._cuttingPlaneXSelector);
                this._updateCuttingPlaneIcon(Ui.AxisIndex.Y, this._cuttingPlaneYSelector);
                this._updateCuttingPlaneIcon(Ui.AxisIndex.Z, this._cuttingPlaneZSelector);
                this._updateCuttingPlaneIcon(Ui.AxisIndex.FACE, this._cuttingPlaneFaceSelector);
                if (geometryEnabled) {
                    $(this._cuttingPlaneVisibilitySelector).removeClass(this._selectedClass);
                }
                else {
                    $(this._cuttingPlaneVisibilitySelector).addClass(this._selectedClass);
                }
                if (individualCuttingSection) {
                    $(this._cuttingPlaneGroupToggle).removeClass(this._selectedClass);
                }
                else {
                    $(this._cuttingPlaneGroupToggle).addClass(this._selectedClass);
                }
                if (count > 0) {
                    $(this._cuttingPlaneVisibilitySelector).removeClass(this._disabledClass);
                    $(this._cuttingPlaneResetSelector).removeClass(this._disabledClass);
                }
                else {
                    $(this._cuttingPlaneVisibilitySelector).addClass(this._disabledClass);
                    $(this._cuttingPlaneResetSelector).addClass(this._disabledClass);
                }
                if (count > 1) {
                    $(this._cuttingPlaneGroupToggle).removeClass(this._disabledClass);
                }
                else {
                    $(this._cuttingPlaneGroupToggle).addClass(this._disabledClass);
                }
            };
            Toolbar.prototype._updateCuttingPlaneIcon = function (axis, cuttingPlaneSelector) {
                var $cuttingPlaneButton = $(cuttingPlaneSelector);
                $cuttingPlaneButton.removeClass(this._selectedClass);
                $cuttingPlaneButton.removeClass(this._invertedClass);
                var planeInfo = this._cuttingPlaneController.getPlaneInfo(axis);
                if (planeInfo !== undefined) {
                    if (planeInfo.status === 1 /* Visible */) {
                        $cuttingPlaneButton.addClass(this._selectedClass);
                    }
                    else if (planeInfo.status === 2 /* Inverted */) {
                        $cuttingPlaneButton.addClass(this._invertedClass);
                    }
                }
            };
            Toolbar.prototype._orientToFace = function () {
                var selectionItem = this._viewer.selectionManager.getLast();
                if (selectionItem !== null && selectionItem.isFaceSelection()) {
                    var view = this._viewer.view;
                    var normal = selectionItem.getFaceEntity().getNormal();
                    var position = selectionItem.getPosition();
                    var camera = view.getCamera();
                    var up = Communicator.Point3.cross(normal, new Communicator.Point3(0, 1, 0));
                    if (up.length() < .001) {
                        up = Communicator.Point3.cross(normal, new Communicator.Point3(1, 0, 0));
                    }
                    var zoomDelta = camera.getPosition().subtract(camera.getTarget()).length();
                    camera.setTarget(position);
                    camera.setPosition(Communicator.Point3.add(position, Communicator.Point3.scale(normal, zoomDelta)));
                    camera.setUp(up);
                    return view.fitBounding(selectionItem.getFaceEntity().getBounding(), Communicator.DefaultTransitionDuration, camera);
                }
                return Promise.resolve();
            };
            return Toolbar;
        }());
        Ui.Toolbar = Toolbar;
    })(Ui = Communicator.Ui || (Communicator.Ui = {}));
})(Communicator || (Communicator = {}));
/// <reference path="../js/hoops_web_viewer.d.ts"/>
var Communicator;
(function (Communicator) {
    var Ui;
    (function (Ui) {
        var Desktop;
        (function (Desktop) {
            var Tree;
            (function (Tree) {
                Tree[Tree["Model"] = 0] = "Model";
                Tree[Tree["CadView"] = 1] = "CadView";
                Tree[Tree["Sheets"] = 2] = "Sheets";
                Tree[Tree["Configurations"] = 3] = "Configurations";
                Tree[Tree["Layers"] = 4] = "Layers";
                Tree[Tree["Filters"] = 5] = "Filters";
                Tree[Tree["Types"] = 6] = "Types";
                Tree[Tree["BCF"] = 7] = "BCF";
            })(Tree = Desktop.Tree || (Desktop.Tree = {}));
            var ModelBrowser = /** @class */ (function () {
                function ModelBrowser(elementId, containerId, viewer, isolateZoomHelper, cuttingPlaneController, screenConfiguration) {
                    this._treeMap = new Map();
                    this._scrollTreeMap = new Map();
                    this._elementIdMap = new Map();
                    this._browserWindowMargin = 3;
                    this._scrollRefreshTimer = new Communicator.Internal.Timer();
                    this._scrollRefreshTimestamp = 0;
                    this._scrollRefreshInterval = 300;
                    this._minimized = true;
                    this._elementId = elementId;
                    this._containerId = containerId;
                    this._viewer = viewer;
                    this._isolateZoomHelper = isolateZoomHelper;
                    this._cuttingPlaneController = cuttingPlaneController;
                    this._screenConfiguration = screenConfiguration;
                    this._canvasSize = this._viewer.view.getCanvasSize();
                    this._initElements();
                    this._initEvents();
                    this._minimizeModelBrowser(); // https://techsoft3d.atlassian.net/browse/COM-590
                }
                ModelBrowser.prototype._initEvents = function () {
                    var _this = this;
                    var onModel = function () {
                        _this._showTree(Tree.Model);
                        return Promise.resolve();
                    };
                    this._viewer.setCallbacks({
                        modelStructureLoadBegin: function () {
                            _this._onModelStructureLoadBegin();
                        },
                        modelStructureParseBegin: function () {
                            _this._onModelStructureParsingBegin();
                        },
                        _assemblyTreeReady: function () {
                            _this._onAssemblyTreeReady();
                            return Promise.resolve();
                        },
                        _firstModelLoaded: onModel,
                        _modelSwitched: onModel,
                        frameDrawn: function () {
                            _this._canvasSize = _this._viewer.view.getCanvasSize();
                            _this.onResize(_this._canvasSize.y);
                        }
                    });
                    this._registerScrollRefreshCallbacks();
                    $("#contextMenuButton").on("click", function (event) {
                        var position = new Communicator.Point2(event.clientX, event.clientY);
                        _this._viewer.trigger("contextMenu", position, Communicator.KeyModifiers.None);
                    });
                };
                ModelBrowser.prototype._registerScrollRefreshCallbacks = function () {
                    var _this = this;
                    this._treeMap.forEach(function (tree) {
                        if (tree instanceof Ui.ViewTree) {
                            tree.registerCallback("expand", function () {
                                _this._refreshBrowserScroll();
                            });
                            tree.registerCallback("collapse", function () {
                                _this._refreshBrowserScroll();
                            });
                            tree.registerCallback("addChild", function () {
                                _this._refreshBrowserScroll();
                            });
                        }
                    });
                };
                ModelBrowser.prototype._refreshBrowserScroll = function () {
                    var _this = this;
                    var expectedTimestamp = ++this._scrollRefreshTimestamp;
                    if (this._scrollRefreshTimer.isIdle(0 /* BeforeAction */)) {
                        this._scrollRefreshTimer.set(this._scrollRefreshInterval, function () {
                            _this._scrollTreeMap.forEach(function (iScroll) {
                                iScroll.refresh();
                            });
                            if (expectedTimestamp !== _this._scrollRefreshTimestamp) {
                                _this._refreshBrowserScroll();
                            }
                        });
                    }
                };
                ModelBrowser.prototype._setPropertyWindowVisibility = function (visible) {
                    if (visible) {
                        this._propertyWindow.classList.remove("hidden");
                    }
                    else {
                        this._propertyWindow.classList.add("hidden");
                    }
                    this.onResize(this._viewer.view.getCanvasSize().y);
                };
                ModelBrowser.prototype._setTreeVisibility = function (tree, visibile) {
                    var treeElementId = tree.getElementId();
                    var $treeScrollContainer = $("#" + treeElementId + "ScrollContainer");
                    var $treeTab = $("#" + treeElementId + "Tab");
                    if (visibile) {
                        $treeScrollContainer.show();
                        $treeTab.addClass("browser-tab-selected");
                        if (tree instanceof Ui.BCFTree) {
                            this._setPropertyWindowVisibility(false);
                        }
                        else {
                            this._setPropertyWindowVisibility(true);
                        }
                    }
                    else {
                        $treeScrollContainer.hide();
                        if ($treeTab) {
                            $treeTab.removeClass("browser-tab-selected");
                        }
                    }
                };
                /** @hidden */
                ModelBrowser.prototype._showTree = function (activeTreeType) {
                    var _this = this;
                    this._treeMap.forEach(function (viewTree, treeType) {
                        _this._setTreeVisibility(viewTree, treeType === activeTreeType);
                    });
                    this._refreshBrowserScroll();
                };
                ModelBrowser.prototype._initElements = function () {
                    var _this = this;
                    this._header = this._createHeader();
                    this._browserWindow = this._createBrowserWindow();
                    // property window html
                    this._createPropertyWindow();
                    $(this._browserWindow).resizable({
                        resize: function (event, ui) {
                            event;
                            _this.onResize(ui.size.height);
                        },
                        minWidth: 35,
                        minHeight: 37,
                        handles: "e"
                    });
                    this._elementIdMap.set(Tree.Model, "modelTree");
                    this._elementIdMap.set(Tree.CadView, "cadViewTree");
                    this._elementIdMap.set(Tree.Sheets, "sheetsTree");
                    this._elementIdMap.set(Tree.Configurations, "configurationsTree");
                    this._elementIdMap.set(Tree.Layers, "layersTree");
                    this._elementIdMap.set(Tree.Filters, "filtersTree");
                    this._elementIdMap.set(Tree.Types, "typesTree");
                    this._elementIdMap.set(Tree.BCF, "bcfTree");
                    this._elementIdMap.forEach(function (elementId, treeType) {
                        _this._addTree(elementId, treeType);
                    });
                    this._contextMenu = new Desktop.ModelBrowserContextMenu(this._containerId, this._viewer, this._treeMap, this._isolateZoomHelper);
                };
                ModelBrowser.prototype._getContextMenu = function () {
                    return this._contextMenu;
                };
                ModelBrowser.prototype._addTree = function (elementId, treeType) {
                    var iScroll = this._initializeIScroll(elementId);
                    this._scrollTreeMap.set(treeType, iScroll);
                    var tree;
                    if (treeType === Tree.Model) {
                        tree = new Ui.ModelTree(this._viewer, elementId, iScroll);
                    }
                    else if (treeType === Tree.CadView) {
                        tree = new Ui.CadViewTree(this._viewer, this._cuttingPlaneController, elementId, iScroll);
                    }
                    else if (treeType === Tree.Sheets) {
                        tree = new Ui.SheetsTree(this._viewer, elementId, iScroll);
                    }
                    else if (treeType === Tree.Configurations) {
                        tree = new Ui.ConfigurationsTree(this._viewer, elementId, iScroll);
                    }
                    else if (treeType === Tree.Layers) {
                        tree = new Ui.LayersTree(this._viewer, elementId, iScroll);
                    }
                    else if (treeType === Tree.Filters) {
                        tree = new Ui.FiltersTree(this._viewer, elementId, iScroll);
                    }
                    else if (treeType === Tree.Types) {
                        tree = new Ui.TypesTree(this._viewer, elementId, iScroll);
                    }
                    else if (treeType === Tree.BCF) {
                        tree = new Ui.BCFTree(this._viewer, elementId, iScroll);
                    }
                    else {
                        Communicator.Util.TypeAssertNever(treeType);
                    }
                    this._treeMap.set(treeType, tree);
                };
                ModelBrowser.prototype._createBrowserWindow = function () {
                    var div = document.getElementById(this._elementId);
                    $(div).bind("touchmove", function (event) {
                        event.originalEvent.preventDefault();
                    });
                    div.classList.add("ui-modelbrowser-window");
                    div.classList.add("desktop-ui-window");
                    div.classList.add("ui-modelbrowser-small");
                    div.style.position = "absolute";
                    var width = $(window).width();
                    if (width !== undefined) {
                        div.style.width = Math.max((width / 4), 400) + "px";
                    }
                    div.style.top = this._browserWindowMargin + "px";
                    div.style.left = this._browserWindowMargin + "px";
                    div.appendChild(this._header);
                    return div;
                };
                ModelBrowser.prototype._createDiv = function (htmlId, classList) {
                    var div = document.createElement("div");
                    div.id = htmlId;
                    for (var _i = 0, classList_1 = classList; _i < classList_1.length; _i++) {
                        var clazz = classList_1[_i];
                        div.classList.add(clazz);
                    }
                    return div;
                };
                ModelBrowser.prototype._createHeader = function () {
                    var _this = this;
                    var div = this._createDiv("ui-modelbrowser-header", ["ui-modelbrowser-header", "desktop-ui-window-header"]);
                    var t = document.createElement("table");
                    var tr = document.createElement("tr");
                    t.appendChild(tr);
                    var minimizetd = document.createElement("td");
                    minimizetd.classList.add("ui-modelbrowser-minimizetd");
                    this._minimizeButton = this._createDiv("ui-modelbrowser-minimizebutton", ["ui-modelbrowser-minimizebutton", "minimized"]);
                    this._minimizeButton.onclick = function () {
                        _this._onMinimizeButtonClick();
                    };
                    minimizetd.appendChild(this._minimizeButton);
                    tr.appendChild(minimizetd);
                    // model browser label
                    var modelBrowserLabel = document.createElement("td");
                    modelBrowserLabel.id = "modelBrowserLabel";
                    modelBrowserLabel.innerHTML = ""; //"Model Browser";
                    tr.appendChild(modelBrowserLabel);
                    var menuNode = this._createDiv("contextMenuButton", ["ui-modeltree-icon", "menu"]);
                    tr.appendChild(menuNode);
                    div.appendChild(t);
                    this._content = this._createDiv("modelTreeContainer", ["ui-modelbrowser-content", "desktop-ui-window-content"]);
                    this._content.style.overflow = "auto";
                    var loadingDiv = this._createDiv("modelBrowserLoadingDiv", []);
                    loadingDiv.innerHTML = "Loading...";
                    this._content.appendChild(loadingDiv);
                    this._createIScrollWrapper("modelTree");
                    this._createIScrollWrapper("cadViewTree");
                    this._createIScrollWrapper("sheetsTree");
                    this._createIScrollWrapper("configurationsTree");
                    this._createIScrollWrapper("layersTree");
                    this._createIScrollWrapper("filtersTree");
                    this._createIScrollWrapper("typesTree");
                    this._createIScrollWrapper("bcfTree");
                    // tabs
                    this._modelBrowserTabs = this._createDiv("modelBrowserTabs", []);
                    this._createBrowserTab("modelTreeTab", "Model Tree", true, Tree.Model);
                    this._createBrowserTab("cadViewTreeTab", "Views", false, Tree.CadView);
                    this._createBrowserTab("sheetsTreeTab", "Sheets", false, Tree.Sheets);
                    this._createBrowserTab("configurationsTreeTab", "Configurations", false, Tree.Configurations);
                    this._createBrowserTab("layersTreeTab", "Layers", false, Tree.Layers);
                    this._createBrowserTab("filtersTreeTab", "Filters", false, Tree.Filters);
                    this._createBrowserTab("typesTreeTab", "Types", false, Tree.Types);
                    this._createBrowserTab("bcfTreeTab", "BCF", false, Tree.BCF);
                    div.appendChild(this._modelBrowserTabs);
                    return div;
                };
                ModelBrowser.prototype._createIScrollWrapper = function (htmlId) {
                    // extra container wrapping the content of the model browser for touch scrolling
                    var divScrollContainer = this._createDiv(htmlId + "ScrollContainer", []);
                    divScrollContainer.classList.add("tree-scroll-container");
                    divScrollContainer.appendChild(this._createDiv(htmlId, []));
                    this._content.appendChild(divScrollContainer);
                };
                ModelBrowser.prototype._createBrowserTab = function (htmlId, name, selected, tree) {
                    var _this = this;
                    var tab = document.createElement("label");
                    tab.id = htmlId;
                    tab.textContent = name;
                    tab.classList.add("ui-modelbrowser-tab");
                    tab.classList.add("hidden");
                    if (selected) {
                        tab.classList.add("browser-tab-selected");
                    }
                    tab.onclick = function (event) {
                        event;
                        _this._showTree(tree);
                    };
                    this._modelBrowserTabs.appendChild(tab);
                    return tab;
                };
                ModelBrowser.prototype._initializeIScroll = function (htmlId) {
                    var wrapper = $("#" + htmlId + "ScrollContainer").get(0);
                    return new IScroll(wrapper, {
                        mouseWheel: true,
                        scrollbars: true,
                        interactiveScrollbars: true,
                        preventDefault: false
                    });
                };
                ModelBrowser.prototype._createPropertyWindow = function () {
                    var _this = this;
                    this._propertyWindow = document.createElement("div");
                    this._propertyWindow.classList.add("propertyWindow");
                    this._propertyWindow.id = "propertyWindow";
                    var container = document.createElement("div");
                    container.id = "propertyContainer";
                    this._propertyWindow.appendChild(container);
                    this._treePropertyContainer = document.createElement("div");
                    this._treePropertyContainer.id = "treePropertyContainer";
                    this._treePropertyContainer.appendChild(this._content);
                    this._treePropertyContainer.appendChild(this._propertyWindow);
                    this._browserWindow.appendChild(this._treePropertyContainer);
                    $(this._propertyWindow).resizable({
                        resize: function (event, ui) {
                            event;
                            ui;
                            _this.onResize(_this._viewer.view.getCanvasSize().y);
                        },
                        handles: "n"
                    });
                };
                ModelBrowser.prototype._onMinimizeButtonClick = function () {
                    if (!this._minimized) {
                        this._minimizeModelBrowser();
                    }
                    else {
                        this._maximizeModelBrowser();
                    }
                };
                ModelBrowser.prototype._maximizeModelBrowser = function () {
                    var _this = this;
                    this._minimized = false;
                    this.freeze(false);
                    var $minimizeButton = jQuery(this._minimizeButton);
                    $minimizeButton.addClass("maximized");
                    $minimizeButton.removeClass("minimized");
                    jQuery(this._content).slideDown({
                        progress: function () {
                            _this._onSlide();
                            $("#modelBrowserWindow").removeClass("ui-modelbrowser-small");
                        },
                        complete: function () {
                            $(_this._browserWindow).children(".ui-resizable-handle").show();
                        }
                    });
                    this._refreshBrowserScroll();
                };
                ModelBrowser.prototype._minimizeModelBrowser = function () {
                    var _this = this;
                    this._minimized = true;
                    this.freeze(true);
                    var $minimizeButton = jQuery(this._minimizeButton);
                    $minimizeButton.removeClass("maximized");
                    $minimizeButton.addClass("minimized");
                    jQuery(this._content).slideUp({
                        progress: function () {
                            _this._onSlide();
                            $("#modelBrowserWindow").addClass("ui-modelbrowser-small");
                        },
                        complete: function () {
                            $(_this._browserWindow).children(".ui-resizable-handle").hide();
                        }
                    });
                    this._refreshBrowserScroll();
                };
                ModelBrowser.prototype.onResize = function (height) {
                    var headerHeight = $(this._header).outerHeight();
                    var propertyWindowHeight = $(this._propertyWindow).outerHeight();
                    if (headerHeight !== undefined && propertyWindowHeight !== undefined) {
                        this._treePropertyContainer.style.height = height - headerHeight - this._browserWindowMargin * 2 + "px";
                        var contentHeight = height - headerHeight - propertyWindowHeight - this._browserWindowMargin * 2;
                        this._browserWindow.style.height = height - this._browserWindowMargin * 2 + "px";
                        this._content.style.height = contentHeight + "px";
                        this._refreshBrowserScroll();
                    }
                };
                ModelBrowser.prototype._onSlide = function () {
                    var headerHeight = $(this._header).outerHeight();
                    var contentHeight = $(this._content).outerHeight();
                    var propertyWindowHeight = $(this._propertyWindow).outerHeight();
                    if (headerHeight !== undefined && contentHeight !== undefined && propertyWindowHeight !== undefined) {
                        var browserWindowHeight = contentHeight + headerHeight + propertyWindowHeight;
                        this._browserWindow.style.height = browserWindowHeight + "px";
                    }
                };
                ModelBrowser.prototype._onModelStructureParsingBegin = function () {
                    var $loadingDiv = $("#modelBrowserLoadingDiv");
                    $loadingDiv.html("Parsing...");
                };
                ModelBrowser.prototype._onModelStructureLoadBegin = function () {
                    var $containerDiv = $("#" + this._elementId);
                    $containerDiv.show();
                };
                ModelBrowser.prototype._onAssemblyTreeReady = function () {
                    var $loadingDiv = $("#modelBrowserLoadingDiv");
                    $loadingDiv.remove();
                    this._showTree(Tree.Model);
                    var modelBrowserHeight = $(this._elementId).height();
                    if (modelBrowserHeight !== undefined) {
                        this.onResize(modelBrowserHeight);
                    }
                };
                ModelBrowser.prototype.freeze = function (freeze) {
                    this._getTree(Tree.Model).freezeExpansion(freeze);
                };
                ModelBrowser.prototype.enablePartSelection = function (enable) {
                    this._getTree(Tree.Model).enablePartSelection(enable);
                };
                ModelBrowser.prototype.updateSelection = function (items) {
                    this._getTree(Tree.Model).updateSelection(items);
                };
                /** @hidden */
                ModelBrowser.prototype._getTree = function (tree) {
                    return this._treeMap.get(tree);
                };
                return ModelBrowser;
            }());
            Desktop.ModelBrowser = ModelBrowser;
        })(Desktop = Ui.Desktop || (Ui.Desktop = {}));
    })(Ui = Communicator.Ui || (Communicator.Ui = {}));
})(Communicator || (Communicator = {}));
/// <reference path="../Desktop/ModelBrowser.ts"/>
var Communicator;
(function (Communicator) {
    var Ui;
    (function (Ui) {
        var Desktop;
        (function (Desktop) {
            var ModelType;
            (function (ModelType) {
                ModelType[ModelType["Generic"] = 0] = "Generic";
                ModelType[ModelType["Bim"] = 1] = "Bim";
                ModelType[ModelType["Drawing"] = 2] = "Drawing";
            })(ModelType || (ModelType = {}));
            var DesktopUi = /** @class */ (function () {
                function DesktopUi(viewer, screenConfiguration) {
                    if (screenConfiguration === void 0) { screenConfiguration = Communicator.ScreenConfiguration.Desktop; }
                    this._modelType = null;
                    this._suppressMissingModelDialog = false;
                    this._viewer = viewer;
                    this._screenConfiguration = screenConfiguration;
                    this._initElements();
                    this._initEvents();
                }
                DesktopUi.prototype._initElements = function () {
                    this._cuttingPlaneController = new Ui.CuttingPlaneController(this._viewer);
                    var view = this._viewer.view;
                    var axisTriad = view.getAxisTriad();
                    var navCube = view.getNavCube();
                    if (this._screenConfiguration === Communicator.ScreenConfiguration.Mobile) {
                        axisTriad.setAnchor(Communicator.OverlayAnchor.UpperRightCorner);
                        navCube.setAnchor(Communicator.OverlayAnchor.UpperLeftCorner);
                        $("body").addClass("mobile");
                    }
                    this._toolbar = new Ui.Toolbar(this._viewer, this._cuttingPlaneController, this._screenConfiguration);
                    this._toolbar.init();
                    // set handle size larger on mobile
                    var handleOperator = this._viewer.operatorManager.getOperator(Communicator.OperatorId.Handle);
                    if (handleOperator) {
                        handleOperator.setHandleSize(this._screenConfiguration === Communicator.ScreenConfiguration.Mobile ? 3 : 1);
                    }
                    var content = document.getElementById("content");
                    // prevent default right click menu
                    content.oncontextmenu = function () { return false; };
                    this._isolateZoomHelper = new Communicator.IsolateZoomHelper(this._viewer);
                    var modelBrowserDiv = document.createElement("div");
                    modelBrowserDiv.id = "modelBrowserWindow";
                    content.appendChild(modelBrowserDiv);
                    this._modelBrowser = new Desktop.ModelBrowser(modelBrowserDiv.id, content.id, this._viewer, this._isolateZoomHelper, this._cuttingPlaneController, this._screenConfiguration);
                    this._propertyWindow = new Desktop.PropertyWindow(this._viewer, this._isolateZoomHelper);
                    var streamingIndicatorDiv = document.createElement("div");
                    streamingIndicatorDiv.id = "streamingIndicator";
                    content.appendChild(streamingIndicatorDiv);
                    if (this._viewer.getRendererType() === Communicator.RendererType.Client)
                        this._streamingIndicator = new Ui.StreamingIndicator(streamingIndicatorDiv.id, this._viewer);
                    this._contextMenu = new Ui.RightClickContextMenu(content.id, this._viewer, this._isolateZoomHelper);
                    this._timeoutWarningDialog = new Ui.TimeoutWarningDialog(content.id, this._viewer);
                };
                DesktopUi.prototype._initEvents = function () {
                    var _this = this;
                    this._viewer.setCallbacks({
                        sceneReady: function () {
                            _this._onSceneReady();
                        },
                        _modelStructureHeaderParsed: function () {
                            return _this._updateDrawingsUi();
                        },
                        sheetActivated: function () {
                            if (_this._modelType !== ModelType.Drawing) {
                                _this._updateDrawingsUi();
                            }
                        },
                        sheetDeactivated: function () {
                            _this._updateDrawingsUi();
                        },
                        modelLoadFailure: function (modelName, reason) {
                            // prevent redundant error dialog when first model is missing
                            if (_this._suppressMissingModelDialog) {
                                return;
                            }
                            var errorDialog = new Ui.UiDialog("content");
                            errorDialog.setTitle("Model Load Error");
                            var text = "Unable to load ";
                            if (modelName) {
                                text += "'" + modelName + "'";
                            }
                            else {
                                text += "model";
                            }
                            text += ": " + reason;
                            errorDialog.setText(text);
                            errorDialog.show();
                        },
                        modelLoadBegin: function () {
                            _this._suppressMissingModelDialog = false;
                        },
                        missingModel: function (modelPath) {
                            if (!_this._suppressMissingModelDialog) {
                                _this._suppressMissingModelDialog = true;
                                var errorDialog = new Ui.UiDialog("content");
                                errorDialog.setTitle("Missing Model Error");
                                var text = "Unable to load ";
                                text += "'" + modelPath + "'";
                                errorDialog.setText(text);
                                errorDialog.show();
                            }
                        },
                        incrementalSelectionBatchBegin: function () {
                            _this.freezeModelBrowser(true);
                            _this.enableModelBrowserPartSelection(false);
                        },
                        incrementalSelectionBatchEnd: function () {
                            _this.freezeModelBrowser(false);
                            _this.enableModelBrowserPartSelection(true);
                        },
                        incrementalSelectionEnd: function () {
                            _this._modelBrowser.updateSelection(null);
                        },
                        webGlContextLost: function () {
                            var errorDialog = new Ui.UiDialog("content");
                            errorDialog.setTitle("Fatal Error");
                            errorDialog.setText("WebGL context lost. Rendering cannot continue.");
                            errorDialog.show();
                        },
                        XHRonloadend: function (e, status, uri) {
                            e;
                            if (status === 404) {
                                var errorDialog = new Ui.UiDialog("content");
                                errorDialog.setTitle("404 Error");
                                errorDialog.setText("Unable to load " + uri);
                                errorDialog.show();
                            }
                        },
                        modelSwitched: function () {
                            _this._modelType = null;
                            _this._updateDrawingsUi();
                        }
                    });
                };
                DesktopUi.prototype._updateDrawingsUi = function () {
                    return __awaiter(this, void 0, void 0, function () {
                        var view, model, axisTriad, navCube, ps, header;
                        return __generator(this, function (_a) {
                            view = this._viewer.view;
                            model = this._viewer.model;
                            axisTriad = view.getAxisTriad();
                            navCube = view.getNavCube();
                            ps = [];
                            if (this._viewer.isDrawingSheetActive()) {
                                if (this._modelType === ModelType.Drawing) {
                                    return [2 /*return*/];
                                }
                                this._modelType = ModelType.Drawing;
                                $("#cuttingplane-button").hide();
                                $("#cuttingplane-submenu").hide();
                                $("#explode-button").hide();
                                $("#explode-slider").hide();
                                $("#explode-submenu").hide();
                                $("#view-button").hide();
                                $("#view-submenu").hide();
                                $("#camera-button").hide();
                                $("#camera-submenu").hide();
                                $("#tool_separator_4").hide();
                                $("#tool_separator_1").hide();
                                $("#edgeface-button").hide();
                                $("#edgeface-submenu").hide();
                                this._toolbar.reposition();
                                $(".ui-modeltree").addClass("drawing");
                                ps.push(axisTriad.disable());
                                ps.push(navCube.disable());
                                ps.push(this._viewer.view.setDrawMode(Communicator.DrawMode.WireframeOnShaded));
                            }
                            else {
                                if (this._modelType !== null && this._modelType !== ModelType.Drawing) {
                                    return [2 /*return*/];
                                }
                                header = model._firstAssemblyDataHeader();
                                if (header === null) {
                                    this._modelType = ModelType.Generic;
                                }
                                else {
                                    switch (header.originalFileType) {
                                        case Communicator.FileType.Ifc:
                                        case Communicator.FileType.Revit:
                                            this._modelType = ModelType.Bim;
                                            view.setBackfacesVisible(true);
                                            break;
                                        default:
                                            this._modelType = ModelType.Generic;
                                            ps.push(navCube.enable());
                                            break;
                                    }
                                }
                                $("#cuttingplane-button").show();
                                $("#explode-button").show();
                                $("#view-button").show();
                                $("#camera-button").show();
                                $("#tool_separator_4").show();
                                $("#tool_separator_1").show();
                                $("#edgeface-button").show();
                                this._toolbar.reposition();
                                $(".ui-modeltree").removeClass("drawing");
                                ps.push(axisTriad.enable());
                            }
                            return [2 /*return*/, Communicator.Util.waitForAll(ps)];
                        });
                    });
                };
                DesktopUi.prototype._onSceneReady = function () {
                    var _this = this;
                    var ps = [];
                    this._viewer.focusInput(true);
                    var selectionManager = this._viewer.selectionManager;
                    ps.push(selectionManager.setNodeSelectionColor(DesktopUi._defaultPartSelectionColor));
                    ps.push(selectionManager.setNodeSelectionOutlineColor(DesktopUi._defaultPartSelectionOutlineColor));
                    var view = this._viewer.view;
                    ps.push(view.setXRayColor(Communicator.ElementType.Faces, DesktopUi._defaultXRayColor));
                    ps.push(view.setXRayColor(Communicator.ElementType.Lines, DesktopUi._defaultXRayColor));
                    ps.push(view.setXRayColor(Communicator.ElementType.Points, DesktopUi._defaultXRayColor));
                    ps.push(view.setBackgroundColor(DesktopUi._defaultBackgroundColor, DesktopUi._defaultBackgroundColor));
                    var canvas = this._viewer.getViewElement();
                    canvas.addEventListener("mouseenter", function () {
                        _this._viewer.focusInput(true);
                    });
                    return Communicator.Util.waitForAll(ps);
                };
                DesktopUi.prototype.setDeselectOnIsolate = function (deselect) {
                    this._isolateZoomHelper.setDeselectOnIsolate(deselect);
                };
                /* UI API functions */
                DesktopUi.prototype.freezeModelBrowser = function (freeze) {
                    this._modelBrowser.freeze(freeze);
                };
                DesktopUi.prototype.enableModelBrowserPartSelection = function (enable) {
                    this._modelBrowser.enablePartSelection(enable);
                };
                /** @hidden */
                DesktopUi.prototype._getContextMenu = function () {
                    return this._contextMenu;
                };
                /** @hidden */
                DesktopUi.prototype._getModelBrowser = function () {
                    return this._modelBrowser;
                };
                /** @hidden */
                DesktopUi.prototype._getToolbar = function () {
                    return this._toolbar;
                };
                DesktopUi._defaultBackgroundColor = Communicator.Color.white();
                DesktopUi._defaultPartSelectionColor = Communicator.Color.createFromFloat(0, 0.8, 0);
                DesktopUi._defaultPartSelectionOutlineColor = Communicator.Color.createFromFloat(0, 0.8, 0);
                DesktopUi._defaultXRayColor = Communicator.Color.createFromFloat(0, 0.9, 0);
                return DesktopUi;
            }());
            Desktop.DesktopUi = DesktopUi;
        })(Desktop = Ui.Desktop || (Ui.Desktop = {}));
    })(Ui = Communicator.Ui || (Communicator.Ui = {}));
})(Communicator || (Communicator = {}));
/// <reference path="../Common/ContextMenu.ts"/>
var Communicator;
(function (Communicator) {
    var Ui;
    (function (Ui) {
        var Desktop;
        (function (Desktop) {
            var ModelBrowserContextMenu = /** @class */ (function (_super) {
                __extends(ModelBrowserContextMenu, _super);
                function ModelBrowserContextMenu(containerId, viewer, treeMap, isolateZoomHelper) {
                    var _this = _super.call(this, "modelbrowser", containerId, viewer, isolateZoomHelper) || this;
                    _this._treeMap = treeMap;
                    _this._initEvents();
                    return _this;
                }
                ModelBrowserContextMenu.prototype._initEvents = function () {
                    var _this = this;
                    this._registerContextMenuCallback(Desktop.Tree.Model);
                    this._registerContextMenuCallback(Desktop.Tree.Layers);
                    this._registerContextMenuCallback(Desktop.Tree.Types);
                    if (this._viewer.getStreamingMode() === Communicator.StreamingMode.OnDemand) {
                        var requestFunc = function () { return __awaiter(_this, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, this._viewer.model.requestNodes(this.getContextItemIds(false, true))];
                                    case 1:
                                        _a.sent();
                                        return [2 /*return*/];
                                }
                            });
                        }); };
                        this.appendSeparator();
                        this.appendItem("request", "Request", requestFunc);
                    }
                };
                ModelBrowserContextMenu.prototype._registerContextMenuCallback = function (tree) {
                    var _this = this;
                    var viewTree = this._treeMap.get(tree);
                    if (viewTree !== undefined && viewTree instanceof Ui.ViewTree) {
                        viewTree.registerCallback("context", function (htmlId, position) {
                            _this._onTreeContext(htmlId, position);
                        });
                    }
                };
                ModelBrowserContextMenu.prototype._onTreeContext = function (htmlId, position) {
                    var components = htmlId.split(Ui.ModelTree.separator);
                    switch (components[0]) {
                        case "layer":
                            this.setActiveLayerName(htmlId);
                            break;
                        case "types":
                            this.setActiveType(components[1]);
                            break;
                        case "typespart":
                        case "layerpart":
                        case "part":
                            var id = parseInt(components[1], 10);
                            this.setActiveItemId(id);
                            break;
                        default:
                            return;
                    }
                    ;
                    this._position = null;
                    this.showElements(position);
                };
                ModelBrowserContextMenu.prototype._onContextLayerClick = function (event) {
                    event;
                    this.hide();
                };
                return ModelBrowserContextMenu;
            }(Ui.Context.ContextMenu));
            Desktop.ModelBrowserContextMenu = ModelBrowserContextMenu;
        })(Desktop = Ui.Desktop || (Ui.Desktop = {}));
    })(Ui = Communicator.Ui || (Communicator.Ui = {}));
})(Communicator || (Communicator = {}));
/// <reference path="../js/hoops_web_viewer.d.ts"/>
var Communicator;
(function (Communicator) {
    var Ui;
    (function (Ui) {
        var Desktop;
        (function (Desktop) {
            function escapeHtmlText(str) {
                return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
            }
            var PropertyWindow = /** @class */ (function () {
                function PropertyWindow(viewer, isolateZoomHelper) {
                    var _this = this;
                    this._assemblyTreeReadyOccurred = false;
                    this._incrementalSelectionActive = false;
                    isolateZoomHelper;
                    this._viewer = viewer;
                    this._propertyWindow = $("#propertyContainer");
                    var update = function () {
                        _this._update();
                        return Promise.resolve();
                    };
                    this._viewer.setCallbacks({
                        _assemblyTreeReady: function () {
                            _this._onModelStructureReady();
                            return Promise.resolve();
                        },
                        _firstModelLoaded: update,
                        modelSwitched: update,
                        selectionArray: function (events) {
                            if (events.length > 0) {
                                _this._onPartSelection(events[events.length - 1]);
                            }
                        },
                        incrementalSelectionBatchBegin: function () {
                            _this._incrementalSelectionActive = true;
                        },
                        incrementalSelectionBatchEnd: function () {
                            _this._incrementalSelectionActive = false;
                        }
                    });
                }
                PropertyWindow.prototype._update = function (text) {
                    if (text === void 0) { text = "&lt;no properties to display&gt;"; }
                    this._propertyWindow.html(text);
                };
                PropertyWindow.prototype._onModelStructureReady = function () {
                    this._assemblyTreeReadyOccurred = true;
                    this._update();
                };
                PropertyWindow.prototype._createRow = function (key, property, classStr) {
                    if (classStr === void 0) { classStr = ""; }
                    var tableRow = document.createElement("tr");
                    tableRow.id = "propertyTableRow_" + key + "_" + property;
                    if (classStr.length > 0) {
                        tableRow.classList.add(classStr);
                    }
                    var keyDiv = document.createElement("td");
                    keyDiv.id = "propertyDiv_" + key;
                    keyDiv.innerHTML = key;
                    var propertyDiv = document.createElement("td");
                    propertyDiv.id = "propertyDiv_" + property;
                    propertyDiv.innerHTML = property;
                    tableRow.appendChild(keyDiv);
                    tableRow.appendChild(propertyDiv);
                    return tableRow;
                };
                PropertyWindow.prototype._onPartSelection = function (event) {
                    return __awaiter(this, void 0, void 0, function () {
                        var model, nodeId, nodeName, propertyTable, userDataTable, props, propsKeys, _i, propsKeys_1, key_3, k, p, userDataIndices, _a, userDataIndices_1, userDataIndex, userData, k, p;
                        return __generator(this, function (_b) {
                            switch (_b.label) {
                                case 0:
                                    if (!this._assemblyTreeReadyOccurred || this._incrementalSelectionActive)
                                        return [2 /*return*/];
                                    this._update();
                                    model = this._viewer.model;
                                    nodeId = event.getSelection().getNodeId();
                                    if (nodeId === null || !model.isNodeLoaded(nodeId)) {
                                        return [2 /*return*/];
                                    }
                                    nodeName = model.getNodeName(nodeId);
                                    propertyTable = null;
                                    userDataTable = null;
                                    return [4 /*yield*/, model.getNodeProperties(nodeId)];
                                case 1:
                                    props = _b.sent();
                                    propsKeys = [];
                                    if (props !== null) {
                                        propsKeys = Object.keys(props);
                                        if (propsKeys.length > 0) {
                                            propertyTable = document.createElement("table");
                                            propertyTable.id = "propertyTable";
                                            propertyTable.appendChild(this._createRow("Property", "Value", "headerRow"));
                                            propertyTable.appendChild(this._createRow("Name", nodeName !== null ? nodeName : "unnamed"));
                                            for (_i = 0, propsKeys_1 = propsKeys; _i < propsKeys_1.length; _i++) {
                                                key_3 = propsKeys_1[_i];
                                                k = escapeHtmlText(key_3);
                                                p = escapeHtmlText(props[key_3]);
                                                propertyTable.appendChild(this._createRow(k, p));
                                            }
                                        }
                                    }
                                    userDataIndices = model.getNodeUserDataIndices(nodeId);
                                    if (userDataIndices.length > 0) {
                                        userDataTable = document.createElement("table");
                                        userDataTable.id = "propertyTable";
                                        userDataTable.appendChild(this._createRow("User Data Index", "User Data Size", "headerRow"));
                                        for (_a = 0, userDataIndices_1 = userDataIndices; _a < userDataIndices_1.length; _a++) {
                                            userDataIndex = userDataIndices_1[_a];
                                            userData = model.getNodeUserData(nodeId, userDataIndex);
                                            k = typeof userDataIndex === "number"
                                                ? "0x" + userDataIndex.toString(16).toUpperCase()
                                                : "0x" + userDataIndex;
                                            p = "" + userData.length;
                                            userDataTable.appendChild(this._createRow(k, p));
                                        }
                                    }
                                    if (propertyTable === null && userDataTable === null) {
                                        return [2 /*return*/];
                                    }
                                    this._update("");
                                    if (propertyTable !== null) {
                                        this._propertyWindow.append(propertyTable);
                                    }
                                    if (userDataTable !== null) {
                                        this._propertyWindow.append(userDataTable);
                                    }
                                    return [2 /*return*/];
                            }
                        });
                    });
                };
                return PropertyWindow;
            }());
            Desktop.PropertyWindow = PropertyWindow;
        })(Desktop = Ui.Desktop || (Ui.Desktop = {}));
    })(Ui = Communicator.Ui || (Communicator.Ui = {}));
})(Communicator || (Communicator = {}));
/// <reference path="../js/hoops_web_viewer.d.ts"/>
var Communicator;
(function (Communicator) {
    var Ui;
    (function (Ui) {
        var Desktop;
        (function (Desktop) {
            function colorFromRgbString(rgbStr) {
                var rgb = rgbStr.replace(/[^\d,]/g, '').split(',');
                return new Communicator.Color(Number(rgb[0]), Number(rgb[1]), Number(rgb[2]));
            }
            function rgbStringFromColor(color) {
                if (!color) {
                    return "";
                }
                return "rgb(" + Math.round(color.r) + "," + Math.round(color.g) + "," + Math.round(color.b) + ")";
            }
            function getValueAsString(id) {
                var value = $(id).val();
                if (typeof value === "string") {
                    return value;
                }
                return "";
            }
            var SettingTab;
            (function (SettingTab) {
                SettingTab[SettingTab["General"] = 0] = "General";
                SettingTab[SettingTab["Walk"] = 1] = "Walk";
                SettingTab[SettingTab["Drawing"] = 2] = "Drawing";
            })(SettingTab = Desktop.SettingTab || (Desktop.SettingTab = {}));
            var ViewerSettings = /** @class */ (function () {
                function ViewerSettings(viewer) {
                    this._versionInfo = true;
                    this._splatRenderingEnabled = false;
                    this._splatRenderingSize = .003;
                    this._splatRenderingPointSizeUnit = Communicator.PointSizeUnit.ProportionOfBoundingDiagonal;
                    this._honorSceneVisibility = true;
                    this._walkSpeedUnits = 1;
                    this._generalTabLabelId = "#settings-tab-label-general";
                    this._walkTabLabelId = "#settings-tab-label-walk";
                    this._drawingTabLabelId = "#settings-tab-label-drawing";
                    this._generalTabId = "#settings-tab-general";
                    this._walkTabId = "#settings-tab-walk";
                    this._drawingTabId = "#settings-tab-drawing";
                    this._walkKeyIdsMap = new Map();
                    this._viewer = viewer;
                    var view = this._viewer.view;
                    this._navCube = view.getNavCube();
                    this._axisTriad = view.getAxisTriad();
                    this._viewerSettingsSelector = "#viewer-settings-dialog";
                    this._initElements();
                }
                ViewerSettings.prototype.show = function () {
                    var p = this._updateSettings();
                    this._centerWindow();
                    $(this._viewerSettingsSelector).show();
                    return p;
                };
                ViewerSettings.prototype.hide = function () {
                    $(this._viewerSettingsSelector).hide();
                };
                ViewerSettings.prototype._centerWindow = function () {
                    var $settingsDialog = $(this._viewerSettingsSelector);
                    var width = $settingsDialog.width();
                    var height = $settingsDialog.height();
                    if (width !== undefined && height !== undefined) {
                        var canvasSize = this._viewer.view.getCanvasSize();
                        var leftPos = (canvasSize.x - width) / 2;
                        var topPos = (canvasSize.y - height) / 2;
                        $settingsDialog.css({
                            left: leftPos + "px",
                            top: topPos + "px",
                        });
                    }
                };
                ViewerSettings.prototype._initElements = function () {
                    var _this = this;
                    this._walkKeyIdsMap.set(Communicator.WalkDirection.Up, "walk-key-up");
                    this._walkKeyIdsMap.set(Communicator.WalkDirection.Down, "walk-key-down");
                    this._walkKeyIdsMap.set(Communicator.WalkDirection.Left, "walk-key-left");
                    this._walkKeyIdsMap.set(Communicator.WalkDirection.Right, "walk-key-right");
                    this._walkKeyIdsMap.set(Communicator.WalkDirection.Forward, "walk-key-forward");
                    this._walkKeyIdsMap.set(Communicator.WalkDirection.Backward, "walk-key-backward");
                    this._walkKeyIdsMap.set(Communicator.WalkDirection.TiltUp, "walk-key-tilt-up");
                    this._walkKeyIdsMap.set(Communicator.WalkDirection.TiltDown, "walk-key-tilt-down");
                    this._walkKeyIdsMap.set(Communicator.WalkDirection.RotateLeft, "walk-key-rotate-left");
                    this._walkKeyIdsMap.set(Communicator.WalkDirection.RotateRight, "walk-key-rotate-right");
                    $("#viewer-settings-dialog-container").draggable({
                        handle: ".hoops-ui-window-header"
                    });
                    $("INPUT.color-picker").each(function () {
                        $(this).minicolors({
                            position: $(this).attr('data-position') || 'bottom left',
                            format: "rgb",
                            control: "hue"
                        });
                    });
                    $("#viewer-settings-ok-button").click(function () {
                        _this._applySettings();
                        _this.hide();
                    });
                    $("#viewer-settings-cancel-button").click(function () {
                        _this.hide();
                    });
                    $("#viewer-settings-apply-button").click(function () {
                        _this._applySettings();
                    });
                    $("#settings-pmi-enabled").click(function () {
                        _this._updateEnabledStyle("settings-pmi-enabled", ["settings-pmi-color-style"], ["settings-pmi-color"], $("#settings-pmi-enabled").prop("checked"));
                    });
                    $("#settings-splat-rendering-enabled").click(function () {
                        _this._updateEnabledStyle("settings-splat-rendering-enabled", ["settings-splat-enabled-style"], ["settings-splat-rendering-size", "settings-splat-rendering-point-size-unit"], $("#settings-splat-rendering-enabled").prop("checked"));
                    });
                    $("#settings-mouse-look-enabled").click(function () {
                        _this._updateEnabledStyle("settings-mouse-look-enabled", ["settings-mouse-look-style"], ["settings-mouse-look-speed"], $("#settings-mouse-look-enabled").prop("checked"));
                    });
                    $("#settings-bim-mode-enabled").click(function () {
                        _this._updateEnabledStyle("settings-bim-mode-enabled", [], [], $("#settings-bim-mode-enabled").prop("checked"));
                    });
                    $("#settings-bloom-enabled").click(function () {
                        _this._updateEnabledStyle("settings-bloom-enabled", ["settings-bloom-style"], ["settings-bloom-intensity", "settings-bloom-threshold"], $("#settings-bloom-enabled").prop("checked"));
                    });
                    $("#settings-shadow-enabled").click(function () {
                        _this._updateEnabledStyle("settings-shadow-enabled", ["settings-shadow-style"], ["settings-shadow-blur-samples", "settings-shadow-interactive"], $("#settings-shadow-enabled").prop("checked"));
                    });
                    var settingsSilhouetteEnabled = "settings-silhouette-enabled";
                    $("#" + settingsSilhouetteEnabled).click(function () {
                        _this._updateEnabledStyle("" + settingsSilhouetteEnabled, [], [], $("#" + settingsSilhouetteEnabled).prop("checked"));
                    });
                    this._viewer.setCallbacks({
                        _firstModelLoaded: function () { return __awaiter(_this, void 0, void 0, function () {
                            var operatorManager, keyboardWalkOperator, walkSpeed;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0:
                                        operatorManager = this._viewer.operatorManager;
                                        keyboardWalkOperator = operatorManager.getOperator(Communicator.OperatorId.KeyboardWalk);
                                        walkSpeed = keyboardWalkOperator.getWalkSpeed();
                                        if (!(walkSpeed <= 0)) return [3 /*break*/, 2];
                                        return [4 /*yield*/, keyboardWalkOperator.resetDefaultWalkSpeeds()];
                                    case 1:
                                        _a.sent();
                                        this._updateWalkSettingsHelper();
                                        _a.label = 2;
                                    case 2: return [2 /*return*/];
                                }
                            });
                        }); },
                        _resetAssemblyTreeBegin: function () { return __awaiter(_this, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                this._honorSceneVisibility = true;
                                return [2 /*return*/];
                            });
                        }); }
                    });
                    $("#settings-walk-mode").change(function () {
                        var walkMode = parseInt(getValueAsString("#settings-walk-mode"), 10);
                        _this._updateKeyboardWalkModeStyle(walkMode);
                    });
                    $(this._generalTabLabelId).click(function () {
                        _this._switchTab(SettingTab.General);
                    });
                    $(this._walkTabLabelId).click(function () {
                        _this._switchTab(SettingTab.Walk);
                    });
                    $(this._drawingTabLabelId).click(function () {
                        _this._switchTab(SettingTab.Drawing);
                    });
                };
                /** @hidden */
                ViewerSettings.prototype._switchTab = function (tab) {
                    var generalTabLabel = $(this._generalTabLabelId);
                    var walkTabLabel = $(this._walkTabLabelId);
                    var drawingTabLabel = $(this._drawingTabLabelId);
                    var generalTab = $(this._generalTabId);
                    var walkTab = $(this._walkTabId);
                    var drawingTab = $(this._drawingTabId);
                    generalTabLabel.removeClass("selected");
                    generalTab.removeClass("selected");
                    walkTab.removeClass("selected");
                    walkTabLabel.removeClass("selected");
                    drawingTab.removeClass("selected");
                    drawingTabLabel.removeClass("selected");
                    switch (tab) {
                        case SettingTab.General:
                            generalTabLabel.addClass("selected");
                            generalTab.addClass("selected");
                            break;
                        case SettingTab.Walk:
                            walkTab.addClass("selected");
                            walkTabLabel.addClass("selected");
                            break;
                        case SettingTab.Drawing:
                            drawingTab.addClass("selected");
                            drawingTabLabel.addClass("selected");
                            break;
                        default:
                            break;
                    }
                };
                // takes current settings and updates the settings window.
                ViewerSettings.prototype._updateSettings = function () {
                    var _this = this;
                    var view = this._viewer.view;
                    var model = this._viewer.model;
                    var selectionManager = this._viewer.selectionManager;
                    var cuttingManager = this._viewer.cuttingManager;
                    var measureManager = this._viewer.measureManager;
                    var operatorManager = this._viewer.operatorManager;
                    // show version info
                    if (this._versionInfo) {
                        $("#settings-format-version").html(this._viewer.getFormatVersionString());
                        $("#settings-viewer-version").html(this._viewer.getViewerVersionString());
                        this._versionInfo = false;
                    }
                    // read current values
                    var backgroundColor = view.getBackgroundColor();
                    var backgroundColorTop;
                    if (backgroundColor.top === null) {
                        backgroundColorTop = colorFromRgbString("rgb(192,220,248)");
                    }
                    else {
                        backgroundColorTop = backgroundColor.top;
                    }
                    var backgroundColorBottom;
                    if (backgroundColor.bottom === null) {
                        backgroundColorBottom = colorFromRgbString("rgb(192,220,248)");
                    }
                    else {
                        backgroundColorBottom = backgroundColor.bottom;
                    }
                    var selectionColorBody = selectionManager.getNodeSelectionColor();
                    var selectionColorFaceLine = selectionManager.getNodeElementSelectionColor();
                    var measurementColor = measureManager.getMeasurementColor();
                    var projectionMode = view.getProjectionMode();
                    var showBackfaces = view.getBackfacesVisible();
                    var hiddenLineOpacity = view.getHiddenLineSettings().getObscuredLineOpacity();
                    var showCappingGeometry = cuttingManager.getCappingGeometryVisibility();
                    var enableFaceLineSelection = selectionManager.getHighlightFaceElementSelection() && selectionManager.getHighlightLineElementSelection();
                    var cappingGeometryFaceColor = cuttingManager.getCappingFaceColor();
                    var cappingGeometryLineColor = cuttingManager.getCappingLineColor();
                    var ambientOcclusionEnabled = view.getAmbientOcclusionEnabled();
                    var ambientOcclusionRadius = view.getAmbientOcclusionRadius();
                    var antiAliasingEnabled = view.getAntiAliasingMode() === Communicator.AntiAliasingMode.SMAA;
                    var bloomEnabled = view.getBloomEnabled();
                    var bloomIntensity = view.getBloomIntensityScale();
                    var bloomThreshold = view.getBloomThreshold();
                    var silhouetteEnabled = view.getSilhouetteEnabled();
                    var reflectionEnabled = view.getSimpleReflectionEnabled();
                    var shadowEnabled = view.getSimpleShadowEnabled();
                    var shadowInteractive = view.getSimpleShadowInteractiveUpdateEnabled();
                    var blurSamples = view.getSimpleShadowBlurSamples();
                    var pmiColor = model.getPmiColor();
                    var pmiEnabled = model.getPmiColorOverride();
                    var orbitOperator = operatorManager.getOperator(Communicator.OperatorId.Orbit);
                    var orbitCameraTarget = orbitOperator.getOrbitFallbackMode() === Communicator.OrbitFallbackMode.CameraTarget ? true : false;
                    var axisTriadEnabled = this._axisTriad.getEnabled();
                    var navCubeEnabled = this._navCube.getEnabled();
                    this._updateWalkSettings();
                    this._updateDrawingSettings();
                    // update settings window
                    $("#settings-selection-color-body").minicolors("value", rgbStringFromColor(selectionColorBody));
                    $("#settings-selection-color-face-line").minicolors("value", rgbStringFromColor(selectionColorFaceLine));
                    $("#settings-background-top").minicolors("value", rgbStringFromColor(backgroundColorTop));
                    $("#settings-background-bottom").minicolors("value", rgbStringFromColor(backgroundColorBottom));
                    $("#settings-measurement-color").minicolors("value", rgbStringFromColor(measurementColor));
                    $("#settings-capping-face-color").minicolors("value", rgbStringFromColor(cappingGeometryFaceColor));
                    $("#settings-capping-line-color").minicolors("value", rgbStringFromColor(cappingGeometryLineColor));
                    $("#settings-projection-mode").val("" + projectionMode);
                    $("#settings-show-backfaces").prop("checked", showBackfaces);
                    $("#settings-show-capping-geometry").prop("checked", showCappingGeometry);
                    $("#settings-enable-face-line-selection").prop("checked", enableFaceLineSelection);
                    $("#settings-orbit-mode").prop("checked", orbitCameraTarget);
                    $("#settings-select-scene-invisible").prop("checked", this._honorSceneVisibility);
                    $("#settings-ambient-occlusion").prop("checked", ambientOcclusionEnabled);
                    $("#settings-ambient-occlusion-radius").val("" + ambientOcclusionRadius);
                    $("#settings-anti-aliasing").prop("checked", antiAliasingEnabled);
                    $("#settings-bloom-intensity").val("" + bloomIntensity);
                    $("#settings-bloom-threshold").val("" + bloomThreshold);
                    $("#settings-axis-triad").prop("checked", axisTriadEnabled);
                    $("#settings-nav-cube").prop("checked", navCubeEnabled);
                    $("#settings-silhouette-enabled").prop("checked", silhouetteEnabled);
                    $("#settings-reflection-enabled").prop("checked", reflectionEnabled);
                    $("#settings-shadow-interactive").prop("checked", shadowInteractive);
                    $("#settings-shadow-blur-samples").val(blurSamples);
                    $("#settings-pmi-color").minicolors("value", rgbStringFromColor(pmiColor));
                    if (pmiEnabled !== $("#settings-pmi-enabled").prop("checked")) {
                        $("#settings-pmi-enabled").click();
                    }
                    this._viewer.getMinimumFramerate().then(function (minFramerate) {
                        $("#settings-framerate").val("" + minFramerate);
                    });
                    if (hiddenLineOpacity !== undefined) {
                        $("#settings-hidden-line-opacity").val("" + hiddenLineOpacity);
                    }
                    else {
                        $("#settings-hidden-line-opacity").val("");
                    }
                    if (bloomEnabled !== $("#settings-bloom-enabled").prop("checked")) {
                        $("#settings-bloom-enabled").click();
                    }
                    if (shadowEnabled !== $("#settings-shadow-enabled").prop("checked")) {
                        $("#settings-shadow-enabled").click();
                    }
                    var ps = [];
                    /*
                        When the default values of (1, ScreenPixels), splat rendering is considered to be off.
        
                        When splat rendering is turned on, we will use a default of (.003, ProportionOfBoundingDiagonal).
        
                        Each time the viewer settings window is opened, we will check if there have been new values set,
                        and if there are, those will become the new defaults when it is turned on.
                    */
                    ps.push(view.getPointSize().then(function (value) {
                        var splatRenderingSize = value[0];
                        var splatRenderingPointSizeUnit = value[1];
                        _this._splatRenderingEnabled = splatRenderingSize !== 1 || splatRenderingPointSizeUnit !== Communicator.PointSizeUnit.ScreenPixels;
                        if (_this._splatRenderingEnabled !== $("#settings-splat-rendering-enabled").prop("checked")) {
                            $("#settings-splat-rendering-enabled").click();
                        }
                        if (_this._splatRenderingEnabled) {
                            _this._splatRenderingSize = splatRenderingSize;
                            _this._splatRenderingPointSizeUnit = splatRenderingPointSizeUnit;
                        }
                        var splatSize = $("#settings-splat-rendering-size");
                        if (Number(splatSize.prop("step")) > _this._splatRenderingSize) {
                            splatSize.prop("step", "" + _this._splatRenderingSize / 3);
                        }
                        splatSize.val("" + _this._splatRenderingSize);
                        $("#settings-splat-rendering-point-size-unit").val("" + _this._splatRenderingPointSizeUnit);
                    }));
                    ps.push(view.getEyeDomeLightingEnabled().then(function (enabled) {
                        $("#settings-eye-dome-lighting-enabled").prop("checked", enabled);
                    }));
                    return Communicator.Util.waitForAll(ps);
                };
                ViewerSettings.prototype._applySettings = function () {
                    var ps = [];
                    var view = this._viewer.view;
                    var model = this._viewer.model;
                    var cuttingManager = this._viewer.cuttingManager;
                    var selectionManager = this._viewer.selectionManager;
                    this._applyWalkSettings();
                    // set background color
                    var backgroundTop = colorFromRgbString(getValueAsString("#settings-background-top"));
                    var backgroundBottom = colorFromRgbString(getValueAsString("#settings-background-bottom"));
                    ps.push(this._viewer.view.setBackgroundColor(backgroundTop, backgroundBottom));
                    //set selection color
                    var selectionColorBody = colorFromRgbString(getValueAsString("#settings-selection-color-body"));
                    ps.push(selectionManager.setNodeSelectionColor(selectionColorBody));
                    ps.push(selectionManager.setNodeSelectionOutlineColor(selectionColorBody));
                    // set face / line selection color
                    var selectionColorFaceLine = colorFromRgbString(getValueAsString("#settings-selection-color-face-line"));
                    ps.push(selectionManager.setNodeElementSelectionColor(selectionColorFaceLine));
                    ps.push(selectionManager.setNodeElementSelectionOutlineColor(selectionColorFaceLine));
                    // enable face / line selection
                    var enableFaceLineSelection = $("#settings-enable-face-line-selection").prop("checked");
                    ps.push(selectionManager.setHighlightFaceElementSelection(enableFaceLineSelection));
                    ps.push(selectionManager.setHighlightLineElementSelection(enableFaceLineSelection));
                    // set measurement color
                    this._viewer.measureManager.setMeasurementColor(colorFromRgbString(getValueAsString("#settings-measurement-color")));
                    // set PMI color
                    var pmiColor = colorFromRgbString(getValueAsString("#settings-pmi-color"));
                    var pmiEnabled = $("#settings-pmi-enabled").prop("checked");
                    if (pmiColor && pmiEnabled) {
                        model.setPmiColor(pmiColor);
                        ps.push(model.setPmiColorOverride(true));
                    }
                    else {
                        ps.push(model.setPmiColorOverride(false));
                    }
                    // set capping geometry color
                    ps.push(cuttingManager.setCappingFaceColor(colorFromRgbString(getValueAsString("#settings-capping-face-color"))));
                    ps.push(cuttingManager.setCappingLineColor(colorFromRgbString(getValueAsString("#settings-capping-line-color"))));
                    //set projection mode
                    view.setProjectionMode(parseInt(getValueAsString("#settings-projection-mode"), 10));
                    // set show backfaces
                    var showBackfaces = $("#settings-show-backfaces").prop("checked");
                    view.setBackfacesVisible(showBackfaces);
                    // set show capping geometry
                    var showCappingGeometry = $("#settings-show-capping-geometry").prop("checked");
                    ps.push(cuttingManager.setCappingGeometryVisibility(showCappingGeometry));
                    // set framerate
                    var minFramerate = parseInt(getValueAsString("#settings-framerate"), 10);
                    if (minFramerate && minFramerate > 0) {
                        ps.push(this._viewer.setMinimumFramerate(minFramerate));
                    }
                    // set hidden line opacity
                    var hiddenLineOpacity = parseFloat(getValueAsString("#settings-hidden-line-opacity"));
                    view.getHiddenLineSettings().setObscuredLineOpacity(hiddenLineOpacity);
                    if (view.getDrawMode() === Communicator.DrawMode.HiddenLine) {
                        ps.push(view.setDrawMode(Communicator.DrawMode.HiddenLine));
                    }
                    // set orbit fallback mode
                    var orbitOperator = this._viewer.operatorManager.getOperator(Communicator.OperatorId.Orbit);
                    var orbitCameraTarget = $("#settings-orbit-mode").prop("checked");
                    orbitOperator.setOrbitFallbackMode(orbitCameraTarget ? Communicator.OrbitFallbackMode.CameraTarget : Communicator.OrbitFallbackMode.ModelCenter);
                    this._honorSceneVisibility = $("#settings-select-scene-invisible").prop("checked");
                    var forceEffectiveSceneVisibilityMask = this._honorSceneVisibility ? Communicator.SelectionMask.None : Communicator.SelectionMask.All;
                    var selectionOperator = this._viewer.operatorManager.getOperator(Communicator.OperatorId.Select);
                    selectionOperator.setForceEffectiveSceneVisibilityMask(forceEffectiveSceneVisibilityMask);
                    var areaSelectionOperator = this._viewer.operatorManager.getOperator(Communicator.OperatorId.AreaSelect);
                    areaSelectionOperator.setForceEffectiveSceneVisibilityMask(forceEffectiveSceneVisibilityMask);
                    var rayDrillSelectionOperator = this._viewer.operatorManager.getOperator(Communicator.OperatorId.RayDrillSelect);
                    rayDrillSelectionOperator.setForceEffectiveSceneVisibilityMask(forceEffectiveSceneVisibilityMask);
                    // set ambient occlusion mode and radius
                    ps.push(view.setAmbientOcclusionEnabled($("#settings-ambient-occlusion").prop("checked")));
                    ps.push(view.setAmbientOcclusionRadius(parseFloat(getValueAsString("#settings-ambient-occlusion-radius"))));
                    // anti aliasing
                    if ($("#settings-anti-aliasing").prop("checked"))
                        ps.push(view.setAntiAliasingMode(Communicator.AntiAliasingMode.SMAA));
                    else
                        ps.push(view.setAntiAliasingMode(Communicator.AntiAliasingMode.None));
                    // bloom
                    view.setBloomEnabled($("#settings-bloom-enabled").prop("checked"));
                    view.setBloomIntensityScale(parseFloat(getValueAsString("#settings-bloom-intensity")));
                    view.setBloomThreshold(parseFloat(getValueAsString("#settings-bloom-threshold")));
                    // silhouette edges
                    view.setSilhouetteEnabled($("#settings-silhouette-enabled").prop("checked"));
                    // reflection planes
                    view.setSimpleReflectionEnabled($("#settings-reflection-enabled").prop("checked"));
                    // shadows
                    view.setSimpleShadowEnabled($("#settings-shadow-enabled").prop("checked"));
                    view.setSimpleShadowInteractiveUpdateEnabled($("#settings-shadow-interactive").prop("checked"));
                    view.setSimpleShadowBlurSamples(parseInt(getValueAsString("#settings-shadow-blur-samples")));
                    // axis triad
                    if ($("#settings-axis-triad").prop("checked"))
                        ps.push(this._axisTriad.enable());
                    else
                        ps.push(this._axisTriad.disable());
                    // nav cube
                    if ($("#settings-nav-cube").prop("checked"))
                        ps.push(this._navCube.enable());
                    else
                        ps.push(this._navCube.disable());
                    // set splat rendering
                    if ($("#settings-splat-rendering-enabled").prop("checked")) {
                        this._splatRenderingEnabled = true;
                        this._splatRenderingSize = parseFloat(getValueAsString("#settings-splat-rendering-size"));
                        this._splatRenderingPointSizeUnit = parseInt(getValueAsString("#settings-splat-rendering-point-size-unit"), 10);
                        ps.push(view.setPointSize(this._splatRenderingSize, this._splatRenderingPointSizeUnit));
                    }
                    else {
                        this._splatRenderingEnabled = false;
                        ps.push(view.setPointSize(1, Communicator.PointSizeUnit.ScreenPixels));
                    }
                    // set eye-dome lighting
                    ps.push(view.setEyeDomeLightingEnabled($("#settings-eye-dome-lighting-enabled").prop("checked")));
                    ps.push(this._applyDrawingSettings());
                    return Communicator.Util.waitForAll(ps);
                };
                ViewerSettings.prototype._applyWalkKeyText = function (walkDirection, keyCode) {
                    if (keyCode < Communicator.KeyCode.a || keyCode > Communicator.KeyCode.z) {
                        return;
                    }
                    var id = this._walkKeyIdsMap.get(walkDirection);
                    var key = Communicator.KeyCode[keyCode].toUpperCase();
                    $("#" + id).html(key);
                };
                ViewerSettings.prototype._applyWalkSettings = function () {
                    var _this = this;
                    var operatorManager = this._viewer.operatorManager;
                    var keyboardWalkOperator = operatorManager.getOperator(Communicator.OperatorId.KeyboardWalk);
                    var walkModeOperator = operatorManager.getOperator(Communicator.OperatorId.WalkMode);
                    var walkMode = parseInt(getValueAsString("#settings-walk-mode"), 10);
                    walkModeOperator.setWalkMode(walkMode);
                    if (walkMode === Communicator.WalkMode.Keyboard) {
                        var rotationSpeed = parseInt(getValueAsString("#settings-walk-rotation"), 10);
                        var walkSpeed = parseFloat(getValueAsString("#settings-walk-speed")) * this._walkSpeedUnits;
                        var elevationSpeed = parseFloat(getValueAsString("#settings-walk-elevation")) * this._walkSpeedUnits;
                        var viewAngle = parseInt(getValueAsString("#settings-walk-view-angle"), 10);
                        var mouseLookEnabled = $("#settings-mouse-look-enabled").prop("checked");
                        var mouseLookSpeed = parseInt(getValueAsString("#settings-mouse-look-speed"), 10);
                        var bimModeEnabled = $("#settings-bim-mode-enabled").prop("checked");
                        $("#walk-navigation-keys .walk-key").html("");
                        var walkKeyMapping = keyboardWalkOperator.getKeyMapping();
                        walkKeyMapping.forEach(function (walkDirection, keyCode) {
                            _this._applyWalkKeyText(walkDirection, keyCode);
                        });
                        if (walkSpeed === 0) {
                            keyboardWalkOperator.resetDefaultWalkSpeeds().then(function () {
                                _this._updateWalkSettingsHelper();
                            });
                        }
                        else {
                            keyboardWalkOperator.setRotationSpeed(rotationSpeed);
                            keyboardWalkOperator.setWalkSpeed(walkSpeed);
                            keyboardWalkOperator.setElevationSpeed(elevationSpeed);
                            keyboardWalkOperator.setViewAngle(viewAngle);
                            keyboardWalkOperator.setMouseLookEnabled(mouseLookEnabled);
                            keyboardWalkOperator.setMouseLookSpeed(mouseLookSpeed);
                        }
                        if (bimModeEnabled) {
                            var p = this._viewer.model.registerIfcNodes(this._viewer.model.getAbsoluteRootNode());
                            p; // XXX: Should this promise be waited on?
                            keyboardWalkOperator.enableBimMode();
                        }
                        else {
                            keyboardWalkOperator.disableBimMode();
                        }
                    }
                };
                ViewerSettings.prototype._updateKeyboardWalkModeStyle = function (walkMode) {
                    var styleIds = [
                        "walk-rotation-text",
                        "walk-speed-text",
                        "walk-elevation-text",
                        "walk-view-angle-text",
                        "walk-mouse-look-text",
                        "settings-mouse-look-style",
                        "walk-bim-mode-text",
                        "walk-navigation-keys",
                    ];
                    var propertyIds = [
                        "settings-walk-rotation",
                        "settings-walk-speed",
                        "settings-walk-elevation",
                        "settings-walk-view-angle",
                        "settings-mouse-look-enabled",
                        "settings-mouse-look-speed",
                        "settings-bim-mode-enabled",
                    ];
                    this._updateEnabledStyle(null, styleIds, propertyIds, walkMode === Communicator.WalkMode.Keyboard);
                };
                ViewerSettings.prototype._updateWalkSpeedUnits = function (walkSpeed) {
                    var logWalkSpeed = Math.log(walkSpeed) / Math.LN10;
                    this._walkSpeedUnits = Math.pow(10, Math.floor(logWalkSpeed));
                    var units = "m";
                    if (this._walkSpeedUnits <= .001) {
                        units = "&micro;m";
                    }
                    else if (this._walkSpeedUnits <= 1) {
                        units = "mm";
                    }
                    else if (this._walkSpeedUnits <= 10) {
                        units = "cm";
                    }
                    else {
                        this._walkSpeedUnits = 1000; //meters
                    }
                    $("#walk-speed-units").html(units);
                    $("#elevation-speed-units").html(units);
                };
                ViewerSettings.prototype._updateWalkSettingsHelper = function () {
                    var operatorManager = this._viewer.operatorManager;
                    var keyboardWalkOperator = operatorManager.getOperator(Communicator.OperatorId.KeyboardWalk);
                    var walkModeOperator = operatorManager.getOperator(Communicator.OperatorId.WalkMode);
                    var rotationSpeed = keyboardWalkOperator.getRotationSpeed();
                    var walkSpeed = keyboardWalkOperator.getWalkSpeed();
                    var elevationSpeed = keyboardWalkOperator.getElevationSpeed();
                    var viewAngle = keyboardWalkOperator.getViewAngle();
                    var mouseLookEnabled = keyboardWalkOperator.getMouseLookEnabled();
                    var mouseLookSpeed = keyboardWalkOperator.getMouseLookSpeed();
                    var bimModeEnabled = keyboardWalkOperator.isBimModeEnabled();
                    var walkMode = walkModeOperator.getWalkMode();
                    this._updateWalkSpeedUnits(walkSpeed);
                    $("#settings-walk-mode").val("" + walkMode);
                    $("#settings-walk-rotation").val("" + rotationSpeed);
                    $("#settings-walk-speed").val((walkSpeed / this._walkSpeedUnits).toFixed(1));
                    $("#settings-walk-elevation").val((elevationSpeed / this._walkSpeedUnits).toFixed(1));
                    $("#settings-walk-view-angle").val("" + viewAngle);
                    $("#settings-mouse-look-speed").val("" + mouseLookSpeed);
                    this._updateEnabledStyle("settings-mouse-look-enabled", ["settings-mouse-look-style"], ["settings-mouse-look-speed"], mouseLookEnabled);
                    this._updateEnabledStyle("settings-bim-mode-enabled", [], [], bimModeEnabled);
                    this._updateKeyboardWalkModeStyle(walkMode);
                };
                ViewerSettings.prototype._updateWalkSettings = function () {
                    var _this = this;
                    var operatorManager = this._viewer.operatorManager;
                    var keyboardWalkOperator = operatorManager.getOperator(Communicator.OperatorId.KeyboardWalk);
                    var walkSpeed = keyboardWalkOperator.getWalkSpeed();
                    if (walkSpeed === 0) {
                        keyboardWalkOperator.resetDefaultWalkSpeeds().then(function () {
                            _this._updateWalkSettingsHelper();
                        });
                    }
                    else {
                        this._updateWalkSettingsHelper();
                    }
                };
                ViewerSettings.prototype._updateDrawingSettings = function () {
                    var sheetBackgroundColor = this._viewer.getSheetBackgroundColor();
                    var sheetColor = this._viewer.getSheetColor();
                    var sheetShadowColor = this._viewer.getSheetShadowColor();
                    var sheetBackgroundEnabled = this._viewer.getBackgroundSheetEnabled();
                    $("#settings-drawing-background").minicolors("value", rgbStringFromColor(sheetBackgroundColor));
                    $("#settings-drawing-sheet").minicolors("value", rgbStringFromColor(sheetColor));
                    $("#settings-drawing-sheet-shadow").minicolors("value", rgbStringFromColor(sheetShadowColor));
                    $("#settings-drawing-background-enabled").prop("checked", sheetBackgroundEnabled);
                };
                ViewerSettings.prototype._applyDrawingSettings = function () {
                    return __awaiter(this, void 0, void 0, function () {
                        var sheetBackgroundColor, sheetColor, sheetShadowColor, backgroundSheetEnabled;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    sheetBackgroundColor = colorFromRgbString(getValueAsString("#settings-drawing-background"));
                                    sheetColor = colorFromRgbString(getValueAsString("#settings-drawing-sheet"));
                                    sheetShadowColor = colorFromRgbString(getValueAsString("#settings-drawing-sheet-shadow"));
                                    backgroundSheetEnabled = $("#settings-drawing-background-enabled").prop("checked");
                                    return [4 /*yield*/, this._viewer.setBackgroundSheetEnabled(backgroundSheetEnabled)];
                                case 1:
                                    _a.sent();
                                    return [4 /*yield*/, this._viewer.setSheetColors(sheetBackgroundColor, sheetColor, sheetShadowColor)];
                                case 2:
                                    _a.sent();
                                    return [2 /*return*/];
                            }
                        });
                    });
                };
                ViewerSettings.prototype._updateEnabledStyle = function (checkboxId, styleIds, propertyIds, enabled) {
                    if (checkboxId !== null) {
                        $("#" + checkboxId).prop("checked", enabled);
                    }
                    if (enabled) {
                        for (var _i = 0, styleIds_1 = styleIds; _i < styleIds_1.length; _i++) {
                            var styleId = styleIds_1[_i];
                            $("#" + styleId).removeClass("grayed-out");
                        }
                    }
                    else {
                        for (var _a = 0, styleIds_2 = styleIds; _a < styleIds_2.length; _a++) {
                            var styleId = styleIds_2[_a];
                            $("#" + styleId).addClass("grayed-out");
                        }
                    }
                    for (var _b = 0, propertyIds_1 = propertyIds; _b < propertyIds_1.length; _b++) {
                        var propertyId = propertyIds_1[_b];
                        $("#" + propertyId).prop("disabled", !enabled);
                    }
                };
                return ViewerSettings;
            }());
            Desktop.ViewerSettings = ViewerSettings;
        })(Desktop = Ui.Desktop || (Ui.Desktop = {}));
    })(Ui = Communicator.Ui || (Communicator.Ui = {}));
})(Communicator || (Communicator = {}));
/// <reference path="../../js/hoops_web_viewer.d.ts"/>
var Communicator;
(function (Communicator) {
    var Ui;
    (function (Ui) {
        var ViewTree = /** @class */ (function () {
            function ViewTree(viewer, elementId, iScroll) {
                this._maxNodeChildrenSize = 300;
                this._tree = new Ui.Control.TreeControl(elementId, viewer, ViewTree.separator, iScroll);
                this._internalId = elementId + "Id";
                this._viewer = viewer;
            }
            ViewTree.prototype.getElementId = function () {
                return this._tree.getElementId();
            };
            ViewTree.prototype.registerCallback = function (name, func) {
                this._tree.registerCallback(name, func);
            };
            ViewTree.prototype._splitHtmlId = function (htmlId) {
                return this._splitHtmlIdParts(htmlId, ViewTree.separator);
            };
            ViewTree.prototype._splitHtmlIdParts = function (htmlId, separator) {
                var splitPos = htmlId.lastIndexOf(separator);
                if (splitPos === -1) {
                    return ["", htmlId];
                }
                return [
                    htmlId.substring(0, splitPos),
                    htmlId.substring(splitPos + separator.length)
                ];
            };
            ViewTree.prototype.hideTab = function () {
                $("#" + this.getElementId() + "Tab").hide();
            };
            ViewTree.prototype.showTab = function () {
                $("#" + this.getElementId() + "Tab").show();
            };
            /** @hidden */
            ViewTree.prototype._getTreeControl = function () {
                return this._tree;
            };
            ViewTree.separator = '_';
            ViewTree.visibilityPrefix = 'visibility';
            return ViewTree;
        }());
        Ui.ViewTree = ViewTree;
    })(Ui = Communicator.Ui || (Communicator.Ui = {}));
})(Communicator || (Communicator = {}));
/// <reference path="../../js/hoops_web_viewer.d.ts"/>
/// <reference path="ViewTree.ts"/>
var Communicator;
(function (Communicator) {
    var Ui;
    (function (Ui) {
        var BCFTree = /** @class */ (function () {
            function BCFTree(viewer, elementId, iScroll) {
                this._idCount = 0;
                this._viewpointIdMap = new Map();
                this._bcfIdMap = new Map();
                this._topicGuidMap = new Map();
                this._topicTitleGuidMap = new Map();
                this._topicCommentsGuidMap = new Map();
                this._commentGuidMap = new Map();
                this._viewer = viewer;
                this._elementId = elementId;
                this._scroll = iScroll;
                this._listRoot = document.createElement("ul");
                this._bcfDataList = document.createElement("select");
                this._initEvents();
            }
            BCFTree.prototype.hideTab = function () {
                $("#" + this._elementId + "Tab").hide();
            };
            BCFTree.prototype.showTab = function () {
                $("#" + this._elementId + "Tab").show();
            };
            BCFTree.prototype.getElementId = function () {
                return this._elementId;
            };
            BCFTree.prototype._refreshScroll = function () {
                if (this._scroll) {
                    this._scroll.refresh();
                }
            };
            BCFTree.prototype._showBCFData = function (bcfId) {
                jQuery("#" + bcfId).show();
                this._bcfIdMap.forEach(function (_id, _bcfId) {
                    if (_bcfId !== bcfId) {
                        jQuery("#" + _bcfId).hide();
                    }
                });
                this._refreshScroll();
            };
            BCFTree.prototype._events = function (container) {
                var _this = this;
                $(container).on("click", ".ui-bcf-topic", function (event) {
                    var $target = jQuery(event.target);
                    var listItem = $target.closest(".viewpoint, .comment").get(0);
                    if (listItem !== undefined) {
                        _this._onTreeSelectItem(listItem.id);
                    }
                });
                $(container).on("change", "select", function (event) {
                    var $target = jQuery(event.target);
                    var selectItem = $target.closest("select").get(0);
                    if (selectItem) {
                        _this._showBCFData(selectItem.value);
                    }
                });
            };
            BCFTree.prototype._addBCFComment = function (topic, text, markupView) {
                return __awaiter(this, void 0, void 0, function () {
                    var markup, date, author, viewpointSnapshotGuid, viewpointFilename, viewpoint, snapshotFilename;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0:
                                markup = topic.getMarkup();
                                date = new Date();
                                author = "";
                                viewpointSnapshotGuid = Communicator.GUID.create();
                                viewpointFilename = viewpointSnapshotGuid + ".bcfv";
                                return [4 /*yield*/, Communicator.BCFViewpoint.createViewpoint(this._viewer, viewpointFilename, markupView)];
                            case 1:
                                viewpoint = _a.sent();
                                topic.setViewpoint(viewpointFilename, viewpoint);
                                snapshotFilename = viewpointSnapshotGuid + ".png";
                                return [4 /*yield*/, this._addSnapshot(topic, snapshotFilename)];
                            case 2:
                                _a.sent();
                                markup.addViewpoint(viewpointSnapshotGuid, viewpointFilename, snapshotFilename);
                                return [2 /*return*/, markup.addComment(date, author, text, viewpointSnapshotGuid)];
                        }
                    });
                });
            };
            BCFTree.prototype._addSnapshot = function (topic, snapshotFilename) {
                return __awaiter(this, void 0, void 0, function () {
                    var img;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0: return [4 /*yield*/, this._viewer.takeSnapshot()];
                            case 1:
                                img = _a.sent();
                                topic.addSnapshot(snapshotFilename, Communicator.BCFSnapshot.snapshotDataFromImage(img));
                                return [2 /*return*/];
                        }
                    });
                });
            };
            /** @hidden */
            BCFTree.prototype._removeBcf = function (bcfId) {
                this._viewer.BCFManager.removeBCFData(bcfId);
            };
            BCFTree.prototype._buildRemoveBCF = function (bcfId) {
                var _this = this;
                var element = document.createElement("div");
                element.classList.add("ui-bcf-input");
                var removeBcfButton = document.createElement("button");
                removeBcfButton.textContent = "Remove BCF";
                element.appendChild(removeBcfButton);
                removeBcfButton.onclick = function () { return __awaiter(_this, void 0, void 0, function () {
                    return __generator(this, function (_a) {
                        this._removeBcf(bcfId);
                        return [2 /*return*/];
                    });
                }); };
                return element;
            };
            /** @hidden */
            BCFTree.prototype._addBcf = function (bcfName) {
                return __awaiter(this, void 0, void 0, function () {
                    var viewer, bcfManager, bcfData, bcfDataId, bcfDataFilename, activeView, topic;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0:
                                viewer = this._viewer;
                                bcfManager = viewer.BCFManager;
                                bcfData = bcfManager.createBCFData(bcfName);
                                bcfDataId = bcfData.getId();
                                bcfDataFilename = bcfData.getFilename();
                                activeView = this._viewer.markupManager.getActiveMarkupView();
                                return [4 /*yield*/, Communicator.BCFTopic.createTopic(viewer, bcfDataId, bcfDataFilename, bcfName, activeView)];
                            case 1:
                                topic = _a.sent();
                                bcfData.addTopic(topic.getTopicId(), topic);
                                viewer.trigger("bcfLoaded", bcfDataId, bcfDataFilename);
                                return [2 /*return*/, bcfData];
                        }
                    });
                });
            };
            BCFTree.prototype._buildAddBCF = function () {
                var _this = this;
                var element = document.createElement("div");
                element.classList.add("ui-bcf-input");
                var label = document.createElement("label");
                label.textContent = "BCF Name: ";
                label.htmlFor = "bcf_name";
                var input = document.createElement("input");
                input.id = "bcf_name";
                input.placeholder = "BCF Name...";
                var addBcfButton = document.createElement("button");
                addBcfButton.textContent = "Add BCF";
                element.appendChild(label);
                element.appendChild(input);
                element.appendChild(addBcfButton);
                addBcfButton.onclick = function () { return __awaiter(_this, void 0, void 0, function () {
                    var bcfName;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0:
                                bcfName = input.value;
                                if (!(bcfName.length > 0)) return [3 /*break*/, 2];
                                input.value = "";
                                return [4 /*yield*/, this._addBcf(bcfName)];
                            case 1:
                                _a.sent();
                                _a.label = 2;
                            case 2: return [2 /*return*/];
                        }
                    });
                }); };
                return element;
            };
            /** @hidden */
            BCFTree.prototype._addTopic = function (bcfData, topicTitle) {
                return __awaiter(this, void 0, void 0, function () {
                    var activeView, topic, topicElement, bcfHtmlId, element;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0:
                                activeView = this._viewer.markupManager.getActiveMarkupView();
                                return [4 /*yield*/, Communicator.BCFTopic.createTopic(this._viewer, bcfData.getId(), bcfData.getFilename(), topicTitle, activeView)];
                            case 1:
                                topic = _a.sent();
                                bcfData.addTopic(topic.getTopicId(), topic);
                                topicElement = this._buildTopic(bcfData, topic);
                                bcfHtmlId = this._getBcfHtmlId(bcfData.getId());
                                if (bcfHtmlId !== null) {
                                    element = document.getElementById(bcfHtmlId);
                                    if (element !== null) {
                                        element.appendChild(topicElement);
                                    }
                                }
                                return [2 /*return*/, topic];
                        }
                    });
                });
            };
            BCFTree.prototype._buildAddTopic = function (bcfData) {
                var _this = this;
                var addTopicElement = document.createElement("div");
                addTopicElement.classList.add("ui-bcf-input");
                var label = document.createElement("label");
                label.textContent = "Topic Title: ";
                label.htmlFor = "topic_title";
                var input = document.createElement("input");
                input.id = "topic_title";
                input.placeholder = "Topic Title...";
                var addTopicButton = document.createElement("button");
                addTopicButton.textContent = "Add Topic";
                addTopicElement.appendChild(label);
                addTopicElement.appendChild(input);
                addTopicElement.appendChild(addTopicButton);
                addTopicButton.onclick = function () { return __awaiter(_this, void 0, void 0, function () {
                    var topicTitle;
                    return __generator(this, function (_a) {
                        topicTitle = input.value;
                        if (topicTitle.length > 0) {
                            input.value = "";
                            this._addTopic(bcfData, topicTitle);
                        }
                        return [2 /*return*/];
                    });
                }); };
                return addTopicElement;
            };
            BCFTree.prototype._initEvents = function () {
                var _this = this;
                var container = document.getElementById(this._elementId);
                if (container === null) {
                    throw new Communicator.CommunicatorError("container is null");
                }
                this._events(container);
                container.appendChild(this._buildAddBCF());
                this._listRoot.classList.add("ui-modeltree");
                this._listRoot.classList.add("ui-modeltree-item");
                container.appendChild(this._bcfDataList);
                container.appendChild(this._listRoot);
                this._viewer.setCallbacks({
                    firstModelLoaded: function (modelRootIds) {
                        var model = _this._viewer.model;
                        modelRootIds.forEach(function (rootId) {
                            if (model.getModelFileTypeFromNode(rootId) === Communicator.FileType.Ifc) {
                                _this.showTab();
                            }
                        });
                    },
                    bcfLoaded: function (id, filename) {
                        _this.showTab();
                        _this._appendBCF(id, filename);
                    },
                    bcfRemoved: function (id) {
                        _this._removeBCF(id);
                    }
                });
            };
            BCFTree.prototype._buildBCFNode = function (id) {
                var element = document.createElement("li");
                element.classList.add("ui-modeltree-item");
                element.id = id;
                return element;
            };
            BCFTree.prototype._buildDiv = function (id, text, elementClass) {
                var element = document.createElement("div");
                if (elementClass !== undefined) {
                    element.classList.add(elementClass);
                }
                element.id = id;
                element.innerHTML = text;
                return element;
            };
            BCFTree.prototype._buildEditDiv = function (id, text, placeholderText, callback, elementClass) {
                var element = document.createElement("input");
                element.classList.add("ui-bcf-edit");
                if (elementClass !== undefined) {
                    element.classList.add(elementClass);
                }
                element.id = id;
                element.value = text;
                element.placeholder = placeholderText;
                element.onblur = function () {
                    if (callback !== undefined && element.textContent !== null) {
                        callback(element.textContent);
                    }
                };
                return element;
            };
            BCFTree.prototype._buildImage = function (url) {
                var element = document.createElement("img");
                element.id = this._getId();
                element.src = url;
                return element;
            };
            BCFTree.prototype._buildDeleteComment = function (bcfTopic, bcfComment, commentElementId) {
                var _this = this;
                var button = document.createElement("button");
                button.classList.add("ui-bcf-comment-delete");
                button.textContent = "Delete";
                button.onclick = function () {
                    _this._deleteComment(bcfTopic, bcfComment, commentElementId);
                };
                return button;
            };
            BCFTree.prototype._buildEditComment = function (commentTextElement, comment) {
                var _this = this;
                var button = document.createElement("button");
                button.textContent = "Edit";
                button.onclick = function () {
                    if (commentTextElement.contentEditable === "true") {
                        commentTextElement.contentEditable = "false";
                        button.textContent = "Edit";
                        var textContent = commentTextElement.textContent;
                        if (textContent !== null) {
                            _this._setCommentText(comment, textContent);
                        }
                    }
                    else {
                        commentTextElement.contentEditable = "true";
                        button.textContent = "Save";
                    }
                };
                return button;
            };
            BCFTree.prototype._buildComment = function (bcfTopic, bcfComment) {
                var commentElementId = this._getId();
                var viewpoint = this._getViewpointFromComment(bcfTopic, bcfComment);
                if (viewpoint !== null) {
                    this._viewpointIdMap.set(commentElementId, viewpoint);
                }
                var commentElement = this._buildDiv(commentElementId, "", "comment");
                var author = "Created by " + bcfComment.getAuthor();
                var date = this._formatDate(bcfComment.getDate());
                var text = bcfComment.getText();
                commentElement.appendChild(this._buildDiv(this._getId(), author));
                commentElement.appendChild(this._buildDiv(this._getId(), date));
                var viewpointGuid = bcfComment.getViewpointGuid();
                if (viewpointGuid !== null) {
                    var markup = bcfTopic.getMarkup();
                    var markupViewpoints = markup.getViewpoints();
                    var markupViewpoint = markupViewpoints.get(viewpointGuid);
                    if (markupViewpoint !== undefined) {
                        var snapshotFilename = markupViewpoint.getSnapshotFilename();
                        if (snapshotFilename !== null) {
                            var snapshot = bcfTopic.getSnapshot(snapshotFilename);
                            if (snapshot !== null) {
                                commentElement.appendChild(this._buildImage(snapshot.getUrl()));
                            }
                        }
                    }
                }
                var commentTextElementId = this._getId();
                this._commentGuidMap.set(bcfComment.getId(), commentTextElementId);
                var commentTextElement = this._buildDiv(commentTextElementId, text);
                commentElement.appendChild(commentTextElement);
                commentElement.appendChild(this._buildEditComment(commentTextElement, bcfComment));
                commentElement.appendChild(this._buildDeleteComment(bcfTopic, bcfComment, commentElementId));
                return commentElement;
            };
            /** @hidden */
            BCFTree.prototype._addComment = function (bcfTopic, text) {
                return __awaiter(this, void 0, void 0, function () {
                    var activeView, bcfComment, commentElem, commentsElementId, commentsElem;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0:
                                activeView = this._viewer.markupManager.getActiveMarkupView();
                                return [4 /*yield*/, this._addBCFComment(bcfTopic, text, activeView)];
                            case 1:
                                bcfComment = _a.sent();
                                commentElem = this._buildComment(bcfTopic, bcfComment);
                                commentsElementId = this._topicCommentsGuidMap.get(bcfTopic.getTopicId());
                                if (commentsElementId !== undefined) {
                                    commentsElem = document.getElementById(commentsElementId);
                                    if (commentsElem !== null) {
                                        commentsElem.appendChild(commentElem);
                                    }
                                }
                                return [2 /*return*/, bcfComment];
                        }
                    });
                });
            };
            /** @hidden */
            BCFTree.prototype._deleteComment = function (bcfTopic, bcfComment, commentElementId) {
                var commentElement = document.getElementById(commentElementId);
                if (commentElement !== null) {
                    commentElement.remove();
                    bcfTopic.getMarkup().deleteComment(bcfComment.getId());
                    this._refreshScroll();
                }
            };
            BCFTree.prototype._setCommentText = function (bcfComment, text) {
                var commentId = this._commentGuidMap.get(bcfComment.getId());
                if (commentId !== undefined) {
                    var commentElement = document.getElementById(commentId);
                    if (commentElement !== null) {
                        bcfComment.setText(text);
                        commentElement.textContent = text;
                        this._refreshScroll();
                    }
                }
            };
            BCFTree.prototype._buildAddComment = function (bcfTopic) {
                var _this = this;
                var addCommentElem = this._buildDiv(this._getId(), "");
                var textArea = document.createElement("textarea");
                textArea.style.width = "100%";
                addCommentElem.appendChild(textArea);
                var button = document.createElement("button");
                button.textContent = "Add Comment";
                addCommentElem.appendChild(button);
                button.onclick = function () { return __awaiter(_this, void 0, void 0, function () {
                    var text;
                    return __generator(this, function (_a) {
                        text = textArea.value;
                        textArea.value = "";
                        if (text.length > 0) {
                            this._addComment(bcfTopic, text);
                        }
                        return [2 /*return*/];
                    });
                }); };
                return addCommentElem;
            };
            BCFTree.prototype._buildTopicData = function (label, value) {
                var element = document.createElement("div");
                element.classList.add("topic-data");
                if (value !== undefined && value !== null) {
                    element.innerHTML = "<b>" + label + "</b>: " + value;
                }
                else {
                    element.innerHTML = "<b>" + label + "</b>: -";
                }
                return element;
            };
            BCFTree.prototype._formatDate = function (date) {
                if (date === undefined) {
                    return '-';
                }
                else {
                    return date.toDateString();
                }
            };
            /** @hidden */
            BCFTree.prototype._deleteTopic = function (bcfData, bcfTopic) {
                var topicElementId = this._topicGuidMap.get(bcfTopic.getTopicId());
                if (topicElementId !== undefined) {
                    var topicElement = document.getElementById(topicElementId);
                    if (topicElement !== null) {
                        topicElement.remove();
                    }
                }
                return bcfData.getTopics().delete(bcfTopic.getTopicId());
            };
            BCFTree.prototype._buildDeleteTopic = function (bcfData, bcfTopic) {
                var _this = this;
                var button = document.createElement("button");
                button.textContent = "Delete Topic";
                button.classList.add("ui-bcf-delete");
                button.onclick = function () { return __awaiter(_this, void 0, void 0, function () {
                    return __generator(this, function (_a) {
                        this._deleteTopic(bcfData, bcfTopic);
                        return [2 /*return*/];
                    });
                }); };
                return button;
            };
            /** @hidden */
            BCFTree.prototype._setTopicTitle = function (bcfTopic, topicTitle) {
                var topicElementId = this._topicTitleGuidMap.get(bcfTopic.getTopicId());
                if (topicElementId !== undefined) {
                    var topicElement = document.getElementById(topicElementId);
                    if (topicElement !== null) {
                        topicElement.textContent = topicTitle;
                    }
                }
                bcfTopic.getMarkup().setTopicTitle(topicTitle);
            };
            BCFTree.prototype._buildTopic = function (bcfData, bcfTopic) {
                var _this = this;
                var topicElementId = this._getId();
                var topicGuid = bcfTopic.getTopicId();
                this._topicGuidMap.set(topicGuid, topicElementId);
                var topicElement = this._buildDiv(topicElementId, "", "ui-bcf-topic");
                var markup = bcfTopic.getMarkup();
                var topicTitle = markup.getTopicTitle();
                var updateTopicTitle = function (topicTitle) {
                    _this._setTopicTitle(bcfTopic, topicTitle);
                };
                var topicTitleId = this._getId();
                this._topicTitleGuidMap.set(topicGuid, topicTitleId);
                topicElement.appendChild(this._buildEditDiv(topicTitleId, topicTitle, "Topic Title", updateTopicTitle, "title"));
                var viewpoint = bcfTopic.getViewpoint('viewpoint.bcfv');
                if (viewpoint !== null) {
                    var bcfViewpointId = this._getId();
                    this._viewpointIdMap.set(bcfViewpointId, viewpoint);
                    var viewpointElement = this._buildDiv(bcfViewpointId, "", "viewpoint");
                    var snapshot = bcfTopic.getSnapshot(viewpoint.getFilename());
                    if (snapshot !== null) {
                        viewpointElement.appendChild(this._buildImage(snapshot.getUrl()));
                    }
                    topicElement.appendChild(viewpointElement);
                }
                var topicData = this._buildDiv(this._getId(), "");
                topicData.appendChild(this._buildTopicData("Author", markup.getTopicCreationAuthor()));
                topicData.appendChild(this._buildTopicData("Description", markup.getTopicDescription()));
                topicData.appendChild(this._buildTopicData("Created", this._formatDate(markup.getTopicCreationDate())));
                topicData.appendChild(this._buildTopicData("Type", markup.getTopicType()));
                topicData.appendChild(this._buildTopicData("Priority", markup.getTopicPriority()));
                topicData.appendChild(this._buildTopicData("Stage", markup.getTopicStage()));
                topicData.appendChild(this._buildTopicData("TopicId", bcfTopic.getTopicId()));
                topicElement.appendChild(topicData);
                var commentsElementId = this._getId();
                var commentsElement = this._buildDiv(commentsElementId, "");
                this._topicCommentsGuidMap.set(topicGuid, commentsElementId);
                bcfTopic.getMarkup().getComments().forEach(function (comment) {
                    commentsElement.appendChild(_this._buildComment(bcfTopic, comment));
                });
                topicElement.appendChild(commentsElement);
                var commentButtonDiv = this._buildAddComment(bcfTopic);
                commentButtonDiv.appendChild(this._buildDeleteTopic(bcfData, bcfTopic));
                topicElement.appendChild(commentButtonDiv);
                return topicElement;
            };
            BCFTree.prototype._buildSelectOption = function (label, id) {
                var element = document.createElement("option");
                element.id = this._getSelectId(id);
                element.value = id;
                element.textContent = label;
                return element;
            };
            BCFTree.prototype._appendBCF = function (id, filename) {
                var _this = this;
                var bcfManager = this._viewer.BCFManager;
                var bcfData = bcfManager.getBCFData(id);
                if (bcfData === null) {
                    return;
                }
                var bcfId = this._getId();
                this._showBCFData(bcfId);
                this._bcfIdMap.set(bcfId, id);
                this._bcfDataList.appendChild(this._buildSelectOption(id + ". " + filename, bcfId));
                this._bcfDataList.value = bcfId;
                var bcfNode = this._buildBCFNode(bcfId);
                this._listRoot.appendChild(bcfNode);
                bcfNode.appendChild(this._buildRemoveBCF(bcfData.getId()));
                bcfNode.appendChild(this._buildAddTopic(bcfData));
                var bcfTopics = bcfData.getTopics();
                bcfTopics.forEach(function (bcfTopic) {
                    var topicNode = _this._buildTopic(bcfData, bcfTopic);
                    bcfNode.appendChild(topicNode);
                });
                this._refreshScroll();
            };
            /** @hidden */
            BCFTree.prototype._getBcfHtmlId = function (id) {
                var bcfId = null;
                this._bcfIdMap.forEach(function (_id, _bcfHtmlId) {
                    if (id === _id) {
                        bcfId = _bcfHtmlId;
                    }
                });
                return bcfId;
            };
            BCFTree.prototype._removeBCF = function (id) {
                var bcfId = this._getBcfHtmlId(id);
                if (bcfId !== null) {
                    this._bcfIdMap.delete(bcfId);
                    $("#" + bcfId).remove();
                    $("#" + this._getSelectId(bcfId)).remove();
                    var bcfDataListValue = this._bcfDataList.value;
                    if (bcfDataListValue.length > 0) {
                        this._showBCFData(bcfDataListValue);
                    }
                }
            };
            BCFTree.prototype._getViewpointFromComment = function (topic, comment) {
                var viewpointGuid = comment.getViewpointGuid();
                if (viewpointGuid !== null) {
                    var markupViewpoints = topic.getMarkup().getViewpoints();
                    var markupViewpoint = markupViewpoints.get(viewpointGuid);
                    if (markupViewpoint !== undefined) {
                        var viewpointFilename = markupViewpoint.getViewpointFilename();
                        if (viewpointFilename !== null) {
                            return topic.getViewpoint(viewpointFilename);
                        }
                    }
                }
                return null;
            };
            BCFTree.prototype._getId = function () {
                return "bcf_" + ++this._idCount;
            };
            BCFTree.prototype._getSelectId = function (bcfId) {
                return "select_" + bcfId;
            };
            BCFTree.prototype._onTreeSelectItem = function (htmlId) {
                var viewpoint = this._getViewpoint(htmlId);
                if (viewpoint !== null) {
                    viewpoint.activate();
                }
            };
            BCFTree.prototype._getViewpoint = function (id) {
                return this._viewpointIdMap.get(id) || null;
            };
            return BCFTree;
        }());
        Ui.BCFTree = BCFTree;
    })(Ui = Communicator.Ui || (Communicator.Ui = {}));
})(Communicator || (Communicator = {}));
/// <reference path="../../js/hoops_web_viewer.d.ts"/>
/// <reference path="ViewTree.ts"/>
var Communicator;
(function (Communicator) {
    var Ui;
    (function (Ui) {
        var CadViewTree = /** @class */ (function (_super) {
            __extends(CadViewTree, _super);
            function CadViewTree(viewer, cuttingPlaneController, elementId, iScroll) {
                var _this = _super.call(this, viewer, elementId, iScroll) || this;
                _this._annotationViewsString = "annotationViews";
                _this._annotationViewsLabel = "Annotation Views";
                _this._viewFolderCreated = false;
                _this._lastSelectedhtmlId = null;
                _this._cuttingPlaneController = cuttingPlaneController;
                _this._tree.setCreateVisibilityItems(false);
                _this._initEvents();
                return _this;
            }
            CadViewTree.prototype._initEvents = function () {
                var _this = this;
                this._viewer.setCallbacks({
                    _firstModelLoaded: function (_modelRootIds, _attachType, isHwf) {
                        _this._onNewModel(isHwf);
                        return Promise.resolve();
                    },
                    modelSwitched: function () {
                        _this._modelSwitched();
                    },
                    sheetActivated: function () {
                        if (_this._viewer.model.isDrawing()) {
                            // SCA : remove the hightlight of the selected view
                            if (_this._lastSelectedhtmlId != null) {
                                var thisElement = document.getElementById(_this._lastSelectedhtmlId);
                                if (thisElement !== null) {
                                    thisElement.classList.remove("selected");
                                }
                            }
                            _this.hideTab();
                        }
                    },
                    sheetDeactivated: function () {
                        if (_this._viewer.model.isDrawing()) {
                            _this.showTab();
                        }
                    },
                    cadViewCreated: function (cadViewId) {
                        _this._onCadViewCreated(cadViewId);
                    }
                });
                this._tree.registerCallback("selectItem", function (id) {
                    _this._onTreeSelectItem(id);
                });
            };
            CadViewTree.prototype._onCadViewCreated = function (cadViewId) {
                // MRL: 04/09/2018: Currently there is no way to directly get a CadView's name from the public API and we are only given the CadViewId
                // This makes it necessary to pull down all the views to get the newly created view's name.
                var cadViews = this._viewer.model.getCadViews();
                var newCadView = {};
                newCadView[cadViewId] = cadViews[cadViewId];
                this._addCadViews(newCadView);
            };
            CadViewTree.prototype._modelSwitched = function () {
                this._tree.clear();
                this._viewFolderCreated = false;
                var isHwf = false; // Because switchToModel is only available for network sessions.
                this._onNewModel(isHwf);
            };
            CadViewTree.prototype._onNewModel = function (isHwf) {
                // Don't add CAD views on newModel if the model is an HWF because CAD views that are
                // dynamically generated during the HWF parsing process trigger other callbacks that
                // add them to the CadViewTree. Otherwise duplicate entries show in the Views Tab.
                if (!isHwf) {
                    var cadViews = this._viewer.model.getCadViews();
                    this._addCadViews(cadViews);
                }
            };
            CadViewTree.prototype._addCadViews = function (cadViews) {
                cadViews = Communicator.Internal.fromIntegerMap(cadViews);
                this._createCadViewNodes(cadViews);
                // remove tab if there is no cad views
                if (cadViews.size <= 0) {
                    this.hideTab();
                }
                else {
                    this.showTab();
                }
                this._tree.expandInitialNodes(this._internalId);
                this._tree.expandInitialNodes(this._internalId + this._annotationViewsString);
            };
            CadViewTree.prototype._createCadViewNodes = function (cadViews) {
                var _this = this;
                if (cadViews.size === 0) {
                    return;
                }
                // Top Level views element should only be created once
                if (!this._viewFolderCreated) {
                    this._tree.appendTopLevelElement("Views", this._internalId, "viewfolder", true);
                    this._viewFolderCreated = true;
                }
                var model = this._viewer.model;
                var enableShatteredModelUiViews = this._viewer.getCreationParameters().enableShatteredModelUiViews === true;
                var allowView = function (nodeId) {
                    return enableShatteredModelUiViews || !model._isWithinExternalModel(nodeId);
                };
                // non-annotated views
                cadViews.forEach(function (name, nodeId) {
                    if (allowView(nodeId) && !model.isAnnotationView(nodeId)) {
                        _this._tree.addChild(name, _this._cadViewId(nodeId), _this._internalId, "view", false, Ui.Desktop.Tree.CadView);
                    }
                });
                // annotation view folder
                cadViews.forEach(function (name, nodeId) {
                    name;
                    if (allowView(nodeId) && model.isAnnotationView(nodeId)) {
                        if (document.getElementById(_this._internalId + _this._annotationViewsString) === null) {
                            _this._tree.addChild(_this._annotationViewsLabel, _this._internalId + _this._annotationViewsString, _this._internalId, "viewfolder", true, Ui.Desktop.Tree.CadView);
                        }
                    }
                });
                // annotation views
                cadViews.forEach(function (name, nodeId) {
                    if (allowView(nodeId) && model.isAnnotationView(nodeId)) {
                        // the folder is already called Annotation Views, remove the annotation view text from the name
                        var parsedValue = name.split("# Annotation View")[0];
                        // add to annotation view folder
                        _this._tree.addChild(parsedValue, _this._cadViewId(nodeId), _this._internalId + _this._annotationViewsString, "view", false, Ui.Desktop.Tree.CadView);
                    }
                });
            };
            CadViewTree.prototype._onTreeSelectItem = function (htmlId) {
                var idParts = this._splitHtmlId(htmlId);
                switch (idParts[0]) {
                    case this._internalId:
                        var handleOperator = this._viewer.operatorManager.getOperator(Communicator.OperatorId.Handle);
                        handleOperator.removeHandles();
                        this._viewer.model.activateCadView(parseInt(idParts[1], 10));
                        break;
                }
                ;
                // toggle recursive selection based on what is clicked
                var thisElement = document.getElementById(htmlId);
                if (thisElement !== null) {
                    if (thisElement.tagName === "LI" && htmlId !== this._internalId && htmlId !== this._internalId + this._annotationViewsString) {
                        thisElement.classList.add("selected");
                        this._lastSelectedhtmlId = htmlId;
                    }
                    else {
                        thisElement.classList.remove("selected");
                    }
                }
            };
            CadViewTree.prototype._cadViewId = function (id) {
                return this._internalId + Ui.ViewTree.separator + id;
            };
            return CadViewTree;
        }(Ui.ViewTree));
        Ui.CadViewTree = CadViewTree;
        /** @deprecated Use [[CadViewTree]] instead. */
        Ui.CADViewTree = CadViewTree;
    })(Ui = Communicator.Ui || (Communicator.Ui = {}));
})(Communicator || (Communicator = {}));
/// <reference path="../../js/hoops_web_viewer.d.ts"/>
/// <reference path="ViewTree.ts"/>
var Communicator;
(function (Communicator) {
    var Ui;
    (function (Ui) {
        var ConfigurationsTree = /** @class */ (function (_super) {
            __extends(ConfigurationsTree, _super);
            function ConfigurationsTree(viewer, elementId, iScroll) {
                var _this = _super.call(this, viewer, elementId, iScroll) || this;
                _this._tree.setCreateVisibilityItems(false);
                _this._initEvents();
                return _this;
            }
            ConfigurationsTree.prototype._initEvents = function () {
                var _this = this;
                this._viewer.setCallbacks({
                    _firstModelLoaded: function () {
                        return _this._onNewModel();
                    },
                    modelSwitched: function () {
                        _this._modelSwitched();
                    },
                    configurationActivated: function (id) {
                        _this._tree.selectItem(_this._configurationsId(id), false);
                    }
                });
                this._tree.registerCallback("selectItem", function (id) {
                    _this._onTreeSelectItem(id);
                });
            };
            ConfigurationsTree.prototype._modelSwitched = function () {
                return this._onNewModel();
            };
            ConfigurationsTree.prototype._onNewModel = function () {
                return __awaiter(this, void 0, void 0, function () {
                    var p, showConfigTab, model, configurations, configCount;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0:
                                this._createConfigurationNodes();
                                showConfigTab = false;
                                model = this._viewer.model;
                                return [4 /*yield*/, model._cadConfigurationsEnabled()];
                            case 1:
                                if (_a.sent()) {
                                    configurations = model.getCadConfigurations();
                                    configCount = Object.keys(configurations).length;
                                    if (configCount > 1) {
                                        showConfigTab = true;
                                    }
                                }
                                if (showConfigTab) {
                                    this.showTab();
                                    p = this._activateDefault();
                                }
                                else {
                                    this.hideTab();
                                    p = Promise.resolve();
                                }
                                this._tree.expandInitialNodes(this._internalId);
                                return [2 /*return*/, p];
                        }
                    });
                });
            };
            ConfigurationsTree.prototype._activateDefault = function () {
                var model = this._viewer.model;
                var id = model.getDefaultCadConfiguration();
                if (id !== null) {
                    return model.activateDefaultCadConfiguration();
                }
                return Promise.resolve();
            };
            ConfigurationsTree.prototype._createConfigurationNodes = function () {
                var _this = this;
                var configurations = this._viewer.model.getCadConfigurations();
                if (Object.keys(configurations).length > 0) {
                    this._tree.appendTopLevelElement("Configurations", this._internalId, "configurations", true);
                    $.each(configurations, function (nodeIdStr, name) {
                        var nodeId = parseInt(nodeIdStr, 10);
                        _this._tree.addChild(name, _this._configurationsId(nodeId), _this._internalId, "view", false, Ui.Desktop.Tree.Configurations);
                    });
                }
            };
            ConfigurationsTree.prototype._onTreeSelectItem = function (htmlId) {
                var idParts = this._splitHtmlId(htmlId);
                switch (idParts[0]) {
                    case this._internalId:
                        var handleOperator = this._viewer.operatorManager.getOperator(Communicator.OperatorId.Handle);
                        handleOperator.removeHandles();
                        this._viewer.model.activateCadConfiguration(parseInt(idParts[1], 10));
                        break;
                }
                ;
            };
            ConfigurationsTree.prototype._configurationsId = function (nodeId) {
                return this._internalId + Ui.ViewTree.separator + nodeId;
            };
            return ConfigurationsTree;
        }(Ui.ViewTree));
        Ui.ConfigurationsTree = ConfigurationsTree;
    })(Ui = Communicator.Ui || (Communicator.Ui = {}));
})(Communicator || (Communicator = {}));
/// <reference path="ViewTree.ts"/>
/// <reference path="../../js/hoops_web_viewer.d.ts"/>
var Communicator;
(function (Communicator) {
    var Ui;
    (function (Ui) {
        var FiltersTree = /** @class */ (function (_super) {
            __extends(FiltersTree, _super);
            function FiltersTree(viewer, elementId, iScroll) {
                var _this = _super.call(this, viewer, elementId, iScroll) || this;
                _this._tree.setCreateVisibilityItems(false);
                _this._initEvents();
                return _this;
            }
            FiltersTree.prototype._initEvents = function () {
                var _this = this;
                var onNewModel = function () {
                    return _this._onNewModel();
                };
                this._viewer.setCallbacks({
                    _assemblyTreeReady: onNewModel,
                    _firstModelLoaded: onNewModel,
                    _modelSwitched: onNewModel
                });
                this._tree.registerCallback("selectItem", function (htmlId) {
                    _this._onTreeSelectItem(htmlId);
                });
            };
            FiltersTree.prototype._onTreeSelectItem = function (htmlId) {
                var thisElement = document.getElementById(htmlId);
                if (thisElement === null) {
                    return;
                }
                var idParts = this._splitHtmlId(htmlId);
                if (idParts[0] === this._internalId) {
                    this._setFilter(parseInt(idParts[1], 10));
                }
            };
            FiltersTree.prototype._setFilter = function (filterId) {
                return __awaiter(this, void 0, void 0, function () {
                    var model, filteredNodes, nodeIds_3;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0: return [4 /*yield*/, this._viewer.model];
                            case 1:
                                model = _a.sent();
                                filteredNodes = model.getNodesFromFiltersId([filterId]);
                                if (!(filteredNodes !== null)) return [3 /*break*/, 10];
                                nodeIds_3 = [];
                                filteredNodes.nodeIds.forEach(function (nodeId) {
                                    nodeIds_3.push(nodeId);
                                });
                                return [4 /*yield*/, this._viewer.pauseRendering()];
                            case 2:
                                _a.sent();
                                return [4 /*yield*/, model.reset()];
                            case 3:
                                _a.sent();
                                if (!filteredNodes.isInclusive) return [3 /*break*/, 6];
                                return [4 /*yield*/, model.setNodesVisibility([model.getAbsoluteRootNode()], false)];
                            case 4:
                                _a.sent();
                                return [4 /*yield*/, model.setNodesVisibility(nodeIds_3, true)];
                            case 5:
                                _a.sent();
                                return [3 /*break*/, 8];
                            case 6: return [4 /*yield*/, model.setNodesVisibility(nodeIds_3, false)];
                            case 7:
                                _a.sent();
                                _a.label = 8;
                            case 8: return [4 /*yield*/, this._viewer.resumeRendering()];
                            case 9:
                                _a.sent();
                                _a.label = 10;
                            case 10: return [2 /*return*/];
                        }
                    });
                });
            };
            FiltersTree.prototype._onNewModel = function () {
                var _this = this;
                this._tree.clear();
                var filters = this._viewer.model.getFilters();
                filters.forEach(function (filterName, filterId) {
                    _this._tree.appendTopLevelElement(filterName, _this.getFilterId(filterId), "assembly", false);
                });
                if (filters.size > 0) {
                    this.showTab();
                }
                else {
                    this.hideTab();
                }
                return Promise.resolve();
            };
            FiltersTree.prototype.getFilterId = function (id) {
                return this._internalId + Ui.ViewTree.separator + id;
            };
            return FiltersTree;
        }(Ui.ViewTree));
        Ui.FiltersTree = FiltersTree;
    })(Ui = Communicator.Ui || (Communicator.Ui = {}));
})(Communicator || (Communicator = {}));
/// <reference path="ViewTree.ts"/>
/// <reference path="../../js/hoops_web_viewer.d.ts"/>
var Communicator;
(function (Communicator) {
    var Ui;
    (function (Ui) {
        var LayersTree = /** @class */ (function (_super) {
            __extends(LayersTree, _super);
            function LayersTree(viewer, elementId, iScroll) {
                var _this = _super.call(this, viewer, elementId, iScroll) || this;
                _this._layerNames = [];
                _this._layerParts = new Set();
                _this._initEvents();
                return _this;
            }
            LayersTree.prototype._initEvents = function () {
                var _this = this;
                var onNewModel = function () {
                    return _this._onNewModel();
                };
                this._viewer.setCallbacks({
                    _firstModelLoaded: onNewModel,
                    _modelSwitched: onNewModel,
                    selectionArray: function (events) {
                        _this._tree.updateSelection(events);
                    },
                    visibilityChanged: function () {
                        _this._tree.updateLayersVisibilityIcons();
                    }
                });
                this._tree.registerCallback("selectItem", function (htmlId, selectionMode) {
                    _this._onTreeSelectItem(htmlId, selectionMode);
                });
                this._tree.registerCallback("loadChildren", function (htmlId) {
                    _this._loadNodeChildren(htmlId);
                });
            };
            LayersTree.prototype._onTreeSelectItem = function (htmlId, selectionMode) {
                if (selectionMode === void 0) { selectionMode = Communicator.SelectionMode.Set; }
                var thisElement = document.getElementById(htmlId);
                if (thisElement === null) {
                    return;
                }
                var idParts = this._splitHtmlId(htmlId);
                switch (idParts[0]) {
                    case "layerpart":
                        this._selectLayerPart(htmlId, selectionMode);
                        break;
                    case "layer":
                        this._selectLayer(htmlId, selectionMode);
                        break;
                }
            };
            LayersTree.prototype._selectLayerPart = function (layerPartId, selectionMode) {
                var partId = LayersTree.getPartId(layerPartId);
                if (partId !== null) {
                    this._viewer.selectPart(partId, selectionMode);
                }
            };
            LayersTree.prototype._selectLayer = function (layerId, selectionMode) {
                var layerName = LayersTree.getLayerName(layerId);
                if (layerName !== null) {
                    this._viewer.selectionManager.selectLayer(layerName, selectionMode);
                }
            };
            LayersTree.prototype._onNewModel = function () {
                return __awaiter(this, void 0, void 0, function () {
                    var _this = this;
                    var model;
                    return __generator(this, function (_a) {
                        model = this._viewer.model;
                        this._tree.clear();
                        this._layerParts.clear();
                        this._layerNames = model.getUniqueLayerNames().sort();
                        this._layerNames.filter(function (layerName) {
                            var layerHtmlId = LayersTree._createId(LayersTree.layerPrefix);
                            LayersTree._layerIdMap.set(layerHtmlId, layerName);
                            LayersTree._idLayerMap.set(layerName, layerHtmlId);
                            var layerIds = model.getLayerIdsFromName(layerName);
                            if (layerIds !== null && layerIds.length > 0) {
                                _this._tree.appendTopLevelElement(layerName, layerHtmlId, "assembly", true, false);
                                return true;
                            }
                            else {
                                return false;
                            }
                        });
                        if (this._layerNames.length > 0) {
                            this.showTab();
                        }
                        else {
                            this.hideTab();
                        }
                        return [2 /*return*/];
                    });
                });
            };
            LayersTree.prototype._loadNodeChildren = function (htmlId) {
                var layerName = LayersTree.getLayerName(htmlId);
                if (layerName === null) {
                    return;
                }
                var layerHtmlId = LayersTree.getLayerId(layerName);
                if (layerHtmlId === null) {
                    return;
                }
                var nodeIds = this._viewer.model.getNodesFromLayerName(layerName, true);
                if (nodeIds === null) {
                    return;
                }
                if (nodeIds.length < this._maxNodeChildrenSize) {
                    this._addLayerParts(layerHtmlId, nodeIds);
                }
                else {
                    this._addLayerPartContainers(layerHtmlId, nodeIds);
                }
            };
            LayersTree.prototype._addLayerParts = function (parentHtmlId, nodeIds) {
                var _this = this;
                var model = this._viewer.model;
                var isDrawing = model.isDrawing();
                nodeIds.forEach(function (nodeId) {
                    var nodeType = model.getNodeType(nodeId);
                    // Don't add BodyInstance nodes for BIM models (or at least add them for drawings)
                    if (!isDrawing && nodeType === Communicator.NodeType.BodyInstance) {
                        var parentId = model.getNodeParent(nodeId);
                        if (parentId !== null) {
                            nodeId = parentId;
                        }
                    }
                    var name = model.getNodeName(nodeId);
                    var partHtmlId = LayersTree._createId(LayersTree.layerPartPrefix);
                    LayersTree._layerPartIdMap.set(partHtmlId, nodeId);
                    LayersTree._idLayerPartMap.set(nodeId, partHtmlId);
                    if (!_this._layerParts.has(nodeId)) {
                        _this._layerParts.add(nodeId);
                        _this._tree.addChild(name, partHtmlId, parentHtmlId, "assembly", false, Ui.Desktop.Tree.Layers);
                    }
                });
            };
            LayersTree.prototype._addLayerPartContainers = function (parentHtmlId, nodeIds) {
                var containerCount = Math.ceil(nodeIds.length / this._maxNodeChildrenSize);
                for (var i = 0; i < containerCount; ++i) {
                    var startIndex = i * this._maxNodeChildrenSize;
                    var rangeEnd = Math.min(startIndex + this._maxNodeChildrenSize, nodeIds.length);
                    var name_1 = "Child Nodes " + startIndex + " - " + rangeEnd;
                    var containerId = LayersTree._createId(LayersTree.layerPartContainerPrefix);
                    this._tree.addChild(name_1, containerId, parentHtmlId, "container", true, Ui.Desktop.Tree.Layers);
                    this._addLayerParts(containerId, nodeIds.slice(startIndex, rangeEnd));
                }
            };
            LayersTree._createId = function (prefix) {
                return "" + prefix + LayersTree.separator + ++this._idCount;
            };
            /**
             * Takes a layer [[HtmlId]] and returns the name of the corresponding layer.
             * @param layerId
             */
            LayersTree.getLayerName = function (layerId) {
                return this._layerIdMap.get(layerId) || null;
            };
            /**
             * Takes a layerName and returns a corresponding layer [[HtmlId]].
             * @param layerName
             */
            LayersTree.getLayerId = function (layerName) {
                return this._idLayerMap.get(layerName) || null;
            };
            /**
             * Takes a layerPart [[HtmlId]] and returns the corresponding [[NodeId]].
             * @param layerPartId
             */
            LayersTree.getPartId = function (layerPartId) {
                return this._layerPartIdMap.get(layerPartId) || null;
            };
            /**
             * Takes a [[NodeId]] and returns the corresponding layerPart [[HtmlId]].
             * @param nodeId
             */
            LayersTree.getLayerPartId = function (nodeId) {
                return this._idLayerPartMap.get(nodeId) || null;
            };
            // prefix for top level layer names
            LayersTree.layerPrefix = 'layer';
            // prefix for parts that are in a layer
            LayersTree.layerPartPrefix = 'layerpart';
            // prefix for layerpart containers
            LayersTree.layerPartContainerPrefix = 'layerpartcontainer';
            LayersTree._idCount = 0;
            LayersTree._layerIdMap = new Map();
            LayersTree._idLayerMap = new Map();
            LayersTree._layerPartIdMap = new Map();
            LayersTree._idLayerPartMap = new Map();
            return LayersTree;
        }(Ui.ViewTree));
        Ui.LayersTree = LayersTree;
    })(Ui = Communicator.Ui || (Communicator.Ui = {}));
})(Communicator || (Communicator = {}));
/// <reference path="../../js/hoops_web_viewer.d.ts"/>
var Communicator;
(function (Communicator) {
    var Ui;
    (function (Ui) {
        var ModelTree = /** @class */ (function (_super) {
            __extends(ModelTree, _super);
            function ModelTree(viewer, elementId, iScroll) {
                var _this = _super.call(this, viewer, elementId, iScroll) || this;
                _this._lastModelRoot = null;
                _this._startedWithoutModelStructure = false;
                _this._partSelectionEnabled = true;
                _this._currentSheetId = null;
                _this._measurementFolderId = "measurementitems";
                _this._updateVisibilityStateTimer = new Communicator.Internal.Timer();
                _this._updateSelectionTimer = new Communicator.Internal.Timer();
                _this._initEvents();
                return _this;
            }
            ModelTree.prototype.freezeExpansion = function (freeze) {
                this._tree.freezeExpansion(freeze);
            };
            ModelTree.prototype.modelStructurePresent = function () {
                var model = this._viewer.model;
                return model.getNodeName(model.getAbsoluteRootNode()) !== "No product structure";
            };
            ModelTree.prototype.enablePartSelection = function (enable) {
                this._partSelectionEnabled = enable;
            };
            ModelTree.prototype._initEvents = function () {
                var _this = this;
                var reset = function () {
                    _this._reset();
                    return Promise.resolve();
                };
                this._viewer.setCallbacks({
                    _assemblyTreeReady: function () {
                        _this._onNewModel();
                        return Promise.resolve();
                    },
                    _firstModelLoaded: reset,
                    hwfParseComplete: reset,
                    modelSwitched: reset,
                    selectionArray: function (events) {
                        _this._onPartSelection(events);
                    },
                    incrementalSelectionBatchEnd: function () {
                        _this._updateSelectionTimer.set(50, function () {
                            _this.updateSelection(null);
                        });
                    },
                    visibilityChanged: function () {
                        _this._tree.getVisibilityControl().updateModelTreeVisibilityState();
                    },
                    viewCreated: function (view) {
                        _this._onNewView(view);
                    },
                    viewLoaded: function (view) {
                        _this._onNewView(view);
                    },
                    subtreeLoaded: function (nodeIdArray) {
                        _this._onSubtreeLoaded(nodeIdArray);
                    },
                    subtreeDeleted: function (nodeIdArray) {
                        _this._onSubtreeDeleted(nodeIdArray);
                    },
                    modelSwitchStart: function () {
                        _this._tree.clear();
                    },
                    measurementCreated: function (measurement) {
                        _this._onNewMeasurement(measurement);
                    },
                    measurementLoaded: function (measurement) {
                        _this._onNewMeasurement(measurement);
                    },
                    measurementDeleted: function (measurement) {
                        _this._onDeleteMeasurement(measurement);
                    },
                    measurementShown: function () {
                        _this._tree.updateMeasurementVisibilityIcons();
                    },
                    measurementHidden: function () {
                        _this._tree.updateMeasurementVisibilityIcons();
                    },
                    sheetActivated: function (id) {
                        if (id !== _this._currentSheetId) {
                            _this._currentSheetId = id;
                            _this._refreshModelTree(id);
                        }
                    },
                    sheetDeactivated: function () {
                        _this._reset();
                    },
                    configurationActivated: function (id) {
                        _this._refreshModelTree(id);
                    }
                });
                this._tree.registerCallback("loadChildren", function (htmlId) {
                    _this._loadNodeChildren(htmlId);
                });
                this._tree.registerCallback("selectItem", function (htmlId, selectionMode) {
                    _this._onTreeSelectItem(htmlId, selectionMode);
                });
            };
            ModelTree.prototype._refreshModelTree = function (nodeId) {
                this._tree.clear();
                var model = this._viewer.model;
                var rootId = model.getAbsoluteRootNode();
                var name = model.getNodeName(rootId);
                // add the top level root, and skip to 'id' for the first child
                this._tree.appendTopLevelElement(name, this._partId(rootId), "modelroot", model.getNodeChildren(rootId).length > 0, false, true);
                this._tree.addChild(model.getNodeName(nodeId), this._partId(nodeId), this._partId(rootId), "part", true, Ui.Desktop.Tree.Model);
                this._tree.expandInitialNodes(this._partId(rootId));
                this._refreshMarkupViews();
            };
            ModelTree.prototype._reset = function () {
                this._tree.clear();
                this._currentSheetId = null;
                this._onNewModel();
            };
            ModelTree.prototype._onNewModel = function () {
                var model = this._viewer.model;
                var rootId = model.getAbsoluteRootNode();
                var name = model.getNodeName(rootId);
                this.showTab();
                /* TODO: Clean this up: erwan currently makes a placeholder node for the root with
                * "No model structure present" text when structure is absent. In this case we do not want to operate under
                * the assumption we have loaded a model root (for further subtree loading)
                */
                this._startedWithoutModelStructure = !this.modelStructurePresent();
                this._lastModelRoot = this._tree.appendTopLevelElement(name, this._partId(rootId), "modelroot", model.getNodeChildren(rootId).length > 0);
                if (!this._viewer.isDrawingSheetActive()) {
                    this._tree.expandInitialNodes(this._partId(rootId));
                }
            };
            ModelTree.prototype._createMarkupViewFolderIfNecessary = function () {
                var $markupViewFolder = $("#markupviews");
                if ($markupViewFolder.length === 0)
                    this._tree.appendTopLevelElement("Markup Views", "markupviews", "viewfolder", false);
            };
            ModelTree.prototype._createMeasurementFolderIfNecessary = function () {
                var $measurementsFolder = $("#" + this._measurementFolderId);
                if ($measurementsFolder.length === 0)
                    this._tree.appendTopLevelElement("Measurements", this._measurementFolderId, "measurement", false);
            };
            ModelTree.prototype._parentChildrenLoaded = function (parent) {
                var parentIdString = this._partId(parent);
                return this._tree.childrenAreLoaded(parentIdString);
            };
            ModelTree.prototype._onSubtreeLoaded = function (nodeIds) {
                var model = this._viewer.model;
                for (var _i = 0, nodeIds_4 = nodeIds; _i < nodeIds_4.length; _i++) {
                    var nodeId = nodeIds_4[_i];
                    if (model.getOutOfHierarchy(nodeId)) {
                        continue;
                    }
                    var parentNodeId = model.getNodeParent(nodeId);
                    if (parentNodeId === null) {
                        console.assert(this._lastModelRoot !== null);
                        this._lastModelRoot = this._tree._insertNodeAfter(model.getNodeName(nodeId), this._partId(nodeId), "modelroot", this._lastModelRoot, true);
                    }
                    else {
                        var initialParent = parentNodeId;
                        do {
                            if (this._parentChildrenLoaded(parentNodeId)) {
                                if (initialParent === parentNodeId) {
                                    this._tree.addChild(model.getNodeName(nodeId), this._partId(nodeId), this._partId(parentNodeId), "assembly", true, Ui.Desktop.Tree.Model);
                                }
                                this._tree.preloadChildrenIfNecessary(this._partId(nodeId));
                                break;
                            }
                            nodeId = parentNodeId;
                            parentNodeId = model.getNodeParent(nodeId);
                        } while (parentNodeId !== null);
                    }
                }
                if (this._startedWithoutModelStructure) {
                    var treeRoot = this._tree.getRoot();
                    if (treeRoot.firstChild !== null) {
                        treeRoot.removeChild(treeRoot.firstChild);
                    }
                    var visibilityRoot = this._tree.getPartVisibilityRoot();
                    if (visibilityRoot.firstChild !== null) {
                        visibilityRoot.removeChild(visibilityRoot.firstChild);
                    }
                }
            };
            ModelTree.prototype._onSubtreeDeleted = function (nodeIds) {
                for (var _i = 0, nodeIds_5 = nodeIds; _i < nodeIds_5.length; _i++) {
                    var nodeId = nodeIds_5[_i];
                    this._tree.deleteNode(this._partId(nodeId));
                }
            };
            ModelTree.prototype._buildTreePathForNode = function (nodeId) {
                // build up the path path from the root to the selected item in the tree
                var model = this._viewer.model;
                var parents = [];
                var parentId = model.getNodeParent(nodeId);
                while (parentId !== null) {
                    // if it's a drawing, prevent loading other items in the tree on selection
                    if (this._viewer.isDrawingSheetActive() && this._currentSheetId !== null && (parentId === this._currentSheetId || nodeId === this._currentSheetId)) {
                        break;
                    }
                    parents.push(parentId);
                    parentId = model.getNodeParent(parentId);
                }
                parents.reverse();
                return parents;
            };
            ModelTree.prototype._expandCorrectContainerForNodeId = function (nodeId) {
                // get all children of parent and figure out which container this node is in
                var model = this._viewer.model;
                var parentId = model.getNodeParent(nodeId);
                if (parentId === null) {
                    return;
                }
                var nodes = model.getNodeChildren(parentId);
                var index = nodes.indexOf(nodeId);
                if (index >= 0) {
                    var containerIndex = Math.floor(index / this._maxNodeChildrenSize);
                    this._tree.expandChildren(this._containerId(parentId, containerIndex));
                }
            };
            ModelTree.prototype._isInsideContainer = function (nodeId) {
                var parentId = this._viewer.model.getNodeParent(nodeId);
                if (parentId === null) {
                    return false;
                }
                var container0HtmlId = this._containerId(parentId, 0);
                var containerElement = $("#" + container0HtmlId);
                return containerElement.length > 0;
            };
            ModelTree.prototype._expandPart = function (nodeId) {
                if (this._viewer.model.isNodeLoaded(nodeId)) {
                    var ancestorIds = this._buildTreePathForNode(nodeId);
                    for (var _i = 0, ancestorIds_1 = ancestorIds; _i < ancestorIds_1.length; _i++) {
                        var ancestorId = ancestorIds_1[_i];
                        // If this node is in a container, we must first expand that container.
                        if (this._isInsideContainer(ancestorId)) {
                            this._expandCorrectContainerForNodeId(ancestorId);
                        }
                        var $node = $("#" + this._partId(ancestorId));
                        var nodeIdAttr = $node.attr("id");
                        if (nodeIdAttr !== undefined) {
                            this._tree.expandChildren(nodeIdAttr);
                        }
                    }
                    if (this._isInsideContainer(nodeId)) {
                        this._expandCorrectContainerForNodeId(nodeId);
                    }
                    this._tree.selectItem(this._partId(nodeId), false);
                }
            };
            ModelTree.prototype._onPartSelection = function (events) {
                if (!this._partSelectionEnabled) {
                    return;
                }
                for (var _i = 0, events_1 = events; _i < events_1.length; _i++) {
                    var event_1 = events_1[_i];
                    var nodeId = event_1.getSelection().getNodeId();
                    if (nodeId === null) {
                        this._tree.selectItem(null, false);
                    }
                    else {
                        this._expandPart(nodeId);
                    }
                }
                if (events.length === 0) {
                    this._tree.updateSelection(null);
                }
            };
            ModelTree.prototype._createContainerNodes = function (partId, childNodes) {
                var containerStartIndex = 1;
                var containerEndIndex = this._maxNodeChildrenSize;
                var containerCount = 0;
                while (true) {
                    var rangeEnd = Math.min(containerEndIndex, childNodes.length);
                    var name_2 = "Child Nodes " + containerStartIndex + " - " + rangeEnd;
                    this._tree.addChild(name_2, this._containerId(partId, containerCount), this._partId(partId), "container", true, Ui.Desktop.Tree.Model);
                    containerStartIndex += this._maxNodeChildrenSize;
                    ++containerCount;
                    if (containerEndIndex >= childNodes.length)
                        return;
                    else
                        containerEndIndex += this._maxNodeChildrenSize;
                }
            };
            ModelTree.prototype._loadAssemblyNodeChildren = function (nodeId) {
                var model = this._viewer.model;
                var children = model.getNodeChildren(nodeId);
                // If this node has a large amount of children, we need to create grouping nodes for it.
                if (children.length > this._maxNodeChildrenSize) {
                    this._createContainerNodes(nodeId, children);
                }
                else {
                    var partId = this._partId(nodeId);
                    this._processNodeChildren(children, partId);
                }
            };
            ModelTree.prototype._loadContainerChildren = function (containerId) {
                var model = this._viewer.model;
                var idParts = this._splitHtmlId(containerId);
                var containerData = this._splitContainerId(idParts[1]);
                // First get all the children for the parent of this container node.
                var children = model.getNodeChildren(parseInt(containerData[0], 10));
                // Next we need to slice the array to contain only the children for this particular container.
                var startIndex = this._maxNodeChildrenSize * parseInt(containerData[1], 10);
                var childrenSlice = children.slice(startIndex, startIndex + this._maxNodeChildrenSize);
                this._processNodeChildren(childrenSlice, containerId);
            };
            ModelTree.prototype._processNodeChildren = function (children, parentId) {
                var _this = this;
                var model = this._viewer.model;
                var pmiFolder = null;
                for (var _i = 0, children_1 = children; _i < children_1.length; _i++) {
                    var childId = children_1[_i];
                    var name_3 = model.getNodeName(childId);
                    var currParentId = parentId;
                    var itemType = "assembly";
                    var ignoreNode = false;
                    switch (model.getNodeType(childId)) {
                        case Communicator.NodeType.Body:
                        case Communicator.NodeType.BodyInstance:
                            itemType = "body";
                            break;
                        case Communicator.NodeType.Pmi:
                            // put pmi's under pmi folder
                            if (pmiFolder === null) {
                                pmiFolder = this._tree.addChild("PMI", this._pmiPartId(childId), parentId, "modelroot", true, Ui.Desktop.Tree.Model);
                            }
                            if (pmiFolder !== null) {
                                currParentId = pmiFolder.id;
                                itemType = "assembly";
                            }
                            break;
                        case Communicator.NodeType.DrawingSheet:
                            if (!this._viewer.isDrawingSheetActive()) {
                                ignoreNode = true;
                            }
                            break;
                    }
                    if (!ignoreNode) {
                        this._tree.addChild(name_3, this._partId(childId), currParentId, itemType, model.getNodeChildren(childId).length > 0, Ui.Desktop.Tree.Model);
                    }
                }
                if (children.length > 0) {
                    this._updateVisibilityStateTimer.set(50, function () {
                        _this._tree.getVisibilityControl().updateModelTreeVisibilityState();
                    });
                }
            };
            ModelTree.prototype._loadNodeChildren = function (htmlId) {
                var idParts = this._splitHtmlId(htmlId);
                var kind = idParts[idParts[0] === "" ? 1 : 0];
                switch (kind) {
                    case "part":
                        var nodeId = parseInt(idParts[1], 10);
                        this._loadAssemblyNodeChildren(nodeId);
                        break;
                    case "container":
                        this._loadContainerChildren(htmlId);
                        break;
                    case "markupviews":
                    case "measurementitems":
                    case "pmipart":
                        // do nothing
                        break;
                    default:
                        console.assert(false);
                        break;
                }
            };
            ModelTree.prototype._onTreeSelectItem = function (htmlId, selectionMode) {
                if (selectionMode === void 0) { selectionMode = Communicator.SelectionMode.Set; }
                // toggle recursive selection base on what is clicked
                var thisElement = document.getElementById(htmlId);
                if (thisElement === null) {
                    return;
                }
                if (thisElement.tagName === "LI" && htmlId !== "markupviews") {
                    thisElement.classList.add("selected");
                }
                else {
                    var viewTree = document.getElementById("markupviews");
                    if (viewTree !== null) {
                        viewTree.classList.remove("selected");
                    }
                }
                // don't allow selection on pmi folder
                if (htmlId.lastIndexOf("pmi", 0) === 0 && thisElement.classList.contains("ui-modeltree-item")) {
                    thisElement.classList.remove("selected");
                }
                var idParts = this._splitHtmlId(htmlId);
                switch (idParts[0]) {
                    case "part":
                        this._viewer.selectPart(parseInt(idParts[1], 10), selectionMode);
                        break;
                    case "markupview":
                        this._viewer.markupManager.activateMarkupViewWithPromise(idParts[1]);
                        break;
                    case "container":
                        this._onContainerClick(idParts[1]);
                        break;
                }
            };
            ModelTree.prototype._onContainerClick = function (containerId) {
                // behavior here to TBD, for now do nothing.
                containerId;
            };
            ModelTree.prototype._onNewView = function (view) {
                this._createMarkupViewFolderIfNecessary();
                this._addMarkupView(view);
            };
            ModelTree.prototype._refreshMarkupViews = function () {
                this._createMarkupViewFolderIfNecessary();
                var markupManager = this._viewer.markupManager;
                var viewKeys = markupManager.getMarkupViewKeys();
                var view;
                for (var _i = 0, viewKeys_1 = viewKeys; _i < viewKeys_1.length; _i++) {
                    var viewKey = viewKeys_1[_i];
                    view = markupManager.getMarkupView(viewKey);
                    if (view !== null) {
                        this._addMarkupView(view);
                    }
                }
            };
            ModelTree.prototype._addMarkupView = function (view) {
                var viewId = this._viewId(view.getUniqueId());
                this._tree.addChild(view.getName(), viewId, "markupviews", "view", false, Ui.Desktop.Tree.Model);
            };
            ModelTree.prototype._onNewMeasurement = function (measurement) {
                this._createMeasurementFolderIfNecessary();
                var measurementId = this._measurementId(measurement._getId());
                this._tree.addChild(measurement.getName(), measurementId, this._measurementFolderId, "measurement", false, Ui.Desktop.Tree.Model);
                this._updateMeasurementsFolderVisibility();
                this._tree.updateMeasurementVisibilityIcons();
            };
            ModelTree.prototype._onDeleteMeasurement = function (measurement) {
                var measurementId = this._measurementId(measurement._getId());
                this._tree.deleteNode(measurementId);
                this._tree.deleteNode("visibility" + ModelTree.separator + measurementId);
                this._updateMeasurementsFolderVisibility();
            };
            ModelTree.prototype._updateMeasurementsFolderVisibility = function () {
                var measurements = this._viewer.measureManager.getAllMeasurements();
                var measurementItems = document.getElementById(this._measurementFolderId);
                if (measurementItems !== null) {
                    measurementItems.style["display"] = measurements.length ? "inherit" : "none";
                }
                var measurementVisibilityItems = document.getElementById("visibility" + ModelTree.separator + this._measurementFolderId);
                if (measurementVisibilityItems !== null) {
                    measurementVisibilityItems.style["display"] = measurements.length ? "inherit" : "none";
                }
            };
            ModelTree.prototype._measurementId = function (measurementGuid) {
                return "measurement" + ModelTree.separator + measurementGuid;
            };
            ModelTree.prototype._partId = function (nodeId) {
                return "part" + ModelTree.separator + nodeId;
            };
            ModelTree.prototype._pmiPartId = function (nodeId) {
                return "pmipart" + ModelTree.separator + nodeId;
            };
            ModelTree.prototype._viewId = function (viewGuid) {
                return "markupview" + ModelTree.separator + viewGuid;
            };
            ModelTree.prototype._containerId = function (partId, containerIndex) {
                console.assert(containerIndex >= 0);
                return "container" + ModelTree.separator + partId + "-" + containerIndex;
            };
            ModelTree.prototype._splitContainerId = function (htmlId) {
                return this._splitHtmlIdParts(htmlId, '-');
            };
            ModelTree.prototype.updateSelection = function (items) {
                this._tree.updateSelection(items);
            };
            return ModelTree;
        }(Ui.ViewTree));
        Ui.ModelTree = ModelTree;
    })(Ui = Communicator.Ui || (Communicator.Ui = {}));
})(Communicator || (Communicator = {}));
/// <reference path="ViewTree.ts"/>
/// <reference path="../../js/hoops_web_viewer.d.ts"/>
var Communicator;
(function (Communicator) {
    var Ui;
    (function (Ui) {
        var SheetsTree = /** @class */ (function (_super) {
            __extends(SheetsTree, _super);
            function SheetsTree(viewer, elementId, iScroll) {
                var _this = _super.call(this, viewer, elementId, iScroll) || this;
                _this._currentSheetId = null;
                _this._3dSheetId = "" + _this._internalId + Ui.ViewTree.separator + "3D";
                _this._tree.setCreateVisibilityItems(false);
                _this._initEvents();
                return _this;
            }
            SheetsTree.prototype._initEvents = function () {
                var _this = this;
                var onNewModel = function () {
                    return _this._onNewModel();
                };
                this._viewer.setCallbacks({
                    _assemblyTreeReady: onNewModel,
                    _firstModelLoaded: onNewModel,
                    _modelSwitched: onNewModel,
                    sheetActivated: function (sheetId) {
                        _this._onSheetActivated(sheetId);
                    },
                    sheetDeactivated: function () {
                        _this._onSheetDeactivated();
                    }
                });
                this._tree.registerCallback("selectItem", function (id) {
                    _this._onTreeSelectItem(id);
                });
            };
            SheetsTree.prototype._setCurrentSheetId = function (htmlId) {
                var $currentSheetNode = $("#" + this._currentSheetId);
                if ($currentSheetNode !== null) {
                    $currentSheetNode.removeClass("selected-sheet");
                }
                var $sheetNode = $("#" + htmlId);
                if ($sheetNode !== null) {
                    $sheetNode.addClass("selected-sheet");
                }
                this._currentSheetId = htmlId;
            };
            SheetsTree.prototype._onNewModel = function () {
                this._tree.clear();
                var p = Promise.resolve();
                if (this._viewer.model.isDrawing()) {
                    var model = this._viewer.model;
                    var sheetNodeIds = this._viewer._getSheetManager().getSheets();
                    for (var _i = 0, sheetNodeIds_1 = sheetNodeIds; _i < sheetNodeIds_1.length; _i++) {
                        var sheetNodeId = sheetNodeIds_1[_i];
                        var name_4 = model.getNodeName(sheetNodeId);
                        var sheetElemId = this._sheetTreeId(sheetNodeId);
                        this._tree.appendTopLevelElement(name_4, sheetElemId, "sheet", false);
                    }
                    if (this._viewer._getSheetManager().get3DNodes().length > 0) {
                        this._tree.appendTopLevelElement("3D Model", this._3dSheetId, "sheet", false, false, false);
                        this._currentSheetId = this._3dSheetId;
                    }
                    this.showTab();
                }
                else {
                    // hide sheets tab if the model is not a drawing
                    this.hideTab();
                }
                return p;
            };
            SheetsTree.prototype._onSheetActivated = function (sheetId) {
                this._setCurrentSheetId(this._sheetTreeId(sheetId));
            };
            SheetsTree.prototype._onSheetDeactivated = function () {
                this._setCurrentSheetId(this._3dSheetId);
            };
            SheetsTree.prototype._onTreeSelectItem = function (htmlId) {
                if (htmlId === this._3dSheetId) {
                    return this._viewer.deactivateSheets();
                }
                else {
                    var idParts = this._splitHtmlId(htmlId);
                    var id = parseInt(idParts[1], 10);
                    if (this._currentSheetId === this._3dSheetId) {
                        this._viewer.model.setViewAxes(new Communicator.Point3(0, 0, 1), new Communicator.Point3(0, 1, 0));
                        this._viewer.setViewOrientation(Communicator.ViewOrientation.Front, 0);
                    }
                    return this._viewer.setActiveSheetId(id);
                }
            };
            SheetsTree.prototype._sheetTreeId = function (sheetId) {
                return "" + this._internalId + Ui.ViewTree.separator + sheetId;
            };
            return SheetsTree;
        }(Ui.ViewTree));
        Ui.SheetsTree = SheetsTree;
    })(Ui = Communicator.Ui || (Communicator.Ui = {}));
})(Communicator || (Communicator = {}));
/// <reference path="../../js/jquery/jquery.d.ts"/>
var Communicator;
(function (Communicator) {
    var Ui;
    (function (Ui) {
        var Control;
        (function (Control) {
            var TaggedId = /** @class */ (function () {
                function TaggedId(id) {
                    this.nodeId = null;
                    this.guid = null;
                    if (typeof id === "number") {
                        this.nodeId = id;
                    }
                    else {
                        this.guid = id;
                    }
                }
                return TaggedId;
            }());
            var VisibilityControl = /** @class */ (function () {
                function VisibilityControl(viewer) {
                    var _this = this;
                    this._fullHiddenParentIds = [];
                    this._partialHiddenParentIds = [];
                    this._assemblyTreeReadyOccurred = false;
                    this._viewer = viewer;
                    var updateVisibilityState = function () {
                        _this.updateModelTreeVisibilityState();
                        return Promise.resolve();
                    };
                    this._viewer.setCallbacks({
                        _assemblyTreeReady: function () {
                            _this._assemblyTreeReadyOccurred = true;
                            return updateVisibilityState();
                        },
                        _firstModelLoaded: updateVisibilityState,
                    });
                }
                VisibilityControl.prototype._clearStyles = function () {
                    for (var _i = 0, _a = this._fullHiddenParentIds; _i < _a.length; _i++) {
                        var id = _a[_i];
                        this._removeVisibilityHiddenClass(id, "partHidden");
                    }
                    this._fullHiddenParentIds.length = 0;
                    for (var _b = 0, _c = this._partialHiddenParentIds; _b < _c.length; _b++) {
                        var id = _c[_b];
                        this._removeVisibilityHiddenClass(id, "partialHidden");
                    }
                    this._partialHiddenParentIds.length = 0;
                };
                VisibilityControl.prototype._applyStyles = function () {
                    for (var _i = 0, _a = this._fullHiddenParentIds; _i < _a.length; _i++) {
                        var id = _a[_i];
                        this._addVisibilityHiddenClass(id, "partHidden");
                    }
                    for (var _b = 0, _c = this._partialHiddenParentIds; _b < _c.length; _b++) {
                        var id = _c[_b];
                        this._addVisibilityHiddenClass(id, "partialHidden");
                    }
                };
                VisibilityControl.prototype.updateModelTreeVisibilityState = function () {
                    // guard against calling model before the model structure is ready
                    if (this._assemblyTreeReadyOccurred) {
                        this._clearStyles();
                        var model = this._viewer.model;
                        var nodeQueue = [model.getAbsoluteRootNode()];
                        for (var _i = 0, nodeQueue_1 = nodeQueue; _i < nodeQueue_1.length; _i++) {
                            var nodeId = nodeQueue_1[_i];
                            var nodeStatus = model.getBranchVisibility(nodeId);
                            if (nodeStatus === Communicator.BranchVisibility.Hidden) {
                                this._fullHiddenParentIds.push(nodeId);
                            }
                            else if (nodeStatus === Communicator.BranchVisibility.Mixed) {
                                this._partialHiddenParentIds.push(nodeId);
                                var nodeChildren = model.getNodeChildren(nodeId);
                                for (var _a = 0, nodeChildren_1 = nodeChildren; _a < nodeChildren_1.length; _a++) {
                                    var child = nodeChildren_1[_a];
                                    nodeQueue.push(child);
                                }
                            }
                        }
                        this._applyStyles();
                    }
                };
                VisibilityControl.prototype._getVisibilityItem = function (nodeId) {
                    return $("#visibility" + Ui.ViewTree.separator + "part" + Ui.ViewTree.separator + nodeId);
                };
                VisibilityControl.prototype._addVisibilityHiddenClass = function (nodeId, className) {
                    this._getVisibilityItem(nodeId).addClass(className);
                };
                VisibilityControl.prototype._removeVisibilityHiddenClass = function (nodeId, className) {
                    this._getVisibilityItem(nodeId).removeClass(className);
                };
                return VisibilityControl;
            }());
            Control.VisibilityControl = VisibilityControl;
            var TreeControl = /** @class */ (function () {
                function TreeControl(elementId, viewer, separator, treeScroll) {
                    // keeps track of the last clicked list item id
                    this._lastItemId = null;
                    // keeps track of the selection items
                    this._selectedPartItems = [];
                    // keep track of nodes that are in the selection set but not in the model tree
                    this._futureHighlightIds = new Set();
                    // keep track of nodes that have children that are selected, but are not in the model tree
                    this._futureMixedIds = new Set();
                    // keep track of selected items parents
                    this._selectedItemsParentIds = [];
                    // keeps track of layer selection items
                    this._selectedLayers = [];
                    // keep track of layers with a selected item
                    this._mixedItemsLayer = new Set();
                    // keeps track of component types selection items
                    this._selectedTypes = [];
                    // keeps track of component type ids that may have children selected
                    this._futureMixedTypesIds = [];
                    // keeps track of component types that have children selected
                    this._mixedTypes = new Set();
                    this._callbacks = new Map();
                    this._childrenLoaded = new Set();
                    this._loadedNodes = new Set();
                    this._touchTimer = new Communicator.Internal.Timer();
                    // prevent the model browser nodes from expanding
                    this._freezeExpansion = false;
                    // Set timer for scrolling and clear it each time a new item in the tree should be visible.
                    // This will avoid scrolling down the tree when several nodes are selected at once.
                    this._scrollTimer = new Communicator.Internal.Timer();
                    // prevent selection highlighting from triggering if multiple items are being selected in succesion
                    this._selectionLabelHighlightTimer = new Communicator.Internal.Timer();
                    // when true, visibility items will be created along with each item added to the tree 
                    this._createVisibilityItems = true;
                    this._elementId = elementId;
                    this._viewer = viewer;
                    this._treeScroll = treeScroll;
                    this._separator = separator;
                    this._visibilityControl = new VisibilityControl(viewer);
                    this._partVisibilityRoot = document.createElement("ul");
                    this._listRoot = document.createElement("ul");
                    this._init();
                }
                TreeControl.prototype.setCreateVisibilityItems = function (createVisibilityItems) {
                    this._createVisibilityItems = createVisibilityItems;
                };
                TreeControl.prototype.getElementId = function () {
                    return this._elementId;
                };
                TreeControl.prototype.getRoot = function () {
                    return this._listRoot;
                };
                TreeControl.prototype.getPartVisibilityRoot = function () {
                    return this._partVisibilityRoot;
                };
                TreeControl.prototype.getVisibilityControl = function () {
                    return this._visibilityControl;
                };
                TreeControl.prototype.registerCallback = function (name, func) {
                    if (!this._callbacks.has(name))
                        this._callbacks.set(name, []);
                    this._callbacks.get(name).push(func);
                };
                TreeControl.prototype._triggerCallback = function (name) {
                    var args = [];
                    for (var _i = 1; _i < arguments.length; _i++) {
                        args[_i - 1] = arguments[_i];
                    }
                    var callbacks = this._callbacks.get(name);
                    if (callbacks) {
                        for (var _a = 0, callbacks_1 = callbacks; _a < callbacks_1.length; _a++) {
                            var callback = callbacks_1[_a];
                            callback.apply(null, args);
                        }
                    }
                };
                TreeControl.prototype.deleteNode = function (htmlId) {
                    if (htmlId.charAt(0) === '#')
                        jQuery(htmlId).remove();
                    else
                        jQuery("#" + htmlId).remove();
                };
                TreeControl.prototype._getTaggedId = function (id, treeType, name) {
                    var annotationViewsLabel = "Annotation Views";
                    if (name !== null && name === annotationViewsLabel && treeType === Ui.Desktop.Tree.CadView) {
                        return new TaggedId(annotationViewsLabel); // return a non null tagged id for annotation views
                    }
                    else {
                        return this._parseTaggedId(id);
                    }
                };
                TreeControl.prototype.addChild = function (name, htmlId, parent, itemType, hasChildren, treeType) {
                    var taggedId = this._getTaggedId(htmlId, treeType, name);
                    if (taggedId === null) {
                        return null;
                    }
                    if (treeType === Ui.Desktop.Tree.Model && itemType !== "container" && taggedId.nodeId !== null) {
                        if (this._loadedNodes.has(taggedId.nodeId)) {
                            return null;
                        }
                        this._loadedNodes.add(taggedId.nodeId);
                    }
                    if (name === null) {
                        name = "unnamed";
                    }
                    // add corresponding visibility icon
                    this._addVisibilityToggleChild(htmlId, parent, itemType);
                    var $parent = jQuery("#" + parent);
                    $parent.children(".ui-modeltree-container").children(".ui-modeltree-expandNode").css("visibility", "visible");
                    var $childList = $parent.children("ul");
                    var selected = false;
                    var mixed = false;
                    if (taggedId.nodeId !== null) {
                        selected = this._futureHighlightIds.has(taggedId.nodeId);
                        mixed = this._futureMixedIds.has(taggedId.nodeId);
                        if (selected) {
                            this._futureHighlightIds.delete(taggedId.nodeId);
                        }
                        if (mixed) {
                            this._futureMixedIds.delete(taggedId.nodeId);
                        }
                    }
                    var node = this._buildNode(name, htmlId, itemType, hasChildren, selected, mixed);
                    // ensure parent node has children
                    if ($childList.length === 0) {
                        var target = document.createElement("ul");
                        target.classList.add("ui-modeltree-children");
                        $parent.append(target);
                        target.appendChild(node);
                    }
                    else {
                        $childList.get(0).appendChild(node);
                    }
                    if (selected) {
                        var $listItem = this._getListItem(htmlId);
                        if ($listItem !== null) {
                            this._selectedPartItems.push($listItem);
                        }
                    }
                    this._triggerCallback("addChild");
                    return node;
                };
                TreeControl.prototype._addVisibilityToggleChild = function (htmlId, parent, itemType) {
                    // mirrors addChild for the visibility toggle icons
                    var $parent = jQuery("#visibility" + this._separator + parent);
                    $parent.children(".ui-modeltree-visibility-container").css("visibility", "visible");
                    var $childList = $parent.children("ul");
                    var target;
                    // ensure parent node has children
                    if ($childList.length === 0) {
                        target = document.createElement("ul");
                        target.classList.add("ui-modeltree-visibility-children");
                        $parent.append(target);
                    }
                    else {
                        target = $childList.get(0);
                    }
                    var node = this._buildPartVisibilityNode(htmlId, itemType);
                    if (node !== null) {
                        target.appendChild(node);
                    }
                };
                TreeControl.prototype._buildPartVisibilityNode = function (htmlId, itemType) {
                    if (!this._createVisibilityItems) {
                        return null;
                    }
                    var itemNode = document.createElement("div");
                    itemNode.classList.add("ui-modeltree-partVisibility-icon");
                    var childItem = document.createElement("li");
                    childItem.classList.add("ui-modeltree-item");
                    childItem.classList.add("visibility");
                    childItem.id = "" + Ui.ViewTree.visibilityPrefix + Ui.ViewTree.separator + htmlId;
                    childItem.appendChild(itemNode);
                    // measurement ids cannot be parsed to check if the node is a PMI
                    // and can result in hiding the visibility icon in the model browser
                    if (itemType !== "measurement") {
                        // hide the visibility icon on PMI items
                        var nodeId = void 0;
                        var nodeIdStr = htmlId.split(this._separator).pop();
                        if (nodeIdStr !== undefined) {
                            nodeId = parseInt(nodeIdStr, 10);
                        }
                        if (nodeId === undefined || isNaN(nodeId)) {
                            return childItem;
                        }
                        var nodeType = this._viewer.model.getNodeType(nodeId);
                        if (nodeType === Communicator.NodeType.Pmi || nodeType === Communicator.NodeType.PmiBody) {
                            childItem.style.visibility = "hidden";
                        }
                    }
                    return childItem;
                };
                TreeControl.prototype.freezeExpansion = function (freeze) {
                    this._freezeExpansion = freeze;
                };
                TreeControl.prototype.updateSelection = function (items) {
                    if (items === null) {
                        items = this._viewer.selectionManager.getResults();
                    }
                    var nodeIds = items.map(function (item) {
                        if (item instanceof Communicator.Event.NodeSelectionEvent) {
                            var x = item.getSelection();
                            if (x.isNodeSelection()) {
                                item = x;
                            }
                            else {
                                console.assert(false);
                                return Communicator.InvalidNodeId;
                            }
                        }
                        return item.getNodeId();
                    });
                    this._updateTreeSelectionHighlight(nodeIds);
                    this._doUnfreezeSelection(nodeIds);
                };
                TreeControl.prototype.collapseAllChildren = function (elementId) {
                    if (!this._freezeExpansion) {
                        $("#" + elementId + " .ui-modeltree-children").hide();
                        $("#" + elementId + " .ui-modeltree-visibility-children").hide();
                        $("#" + elementId + " .expanded").removeClass("expanded");
                    }
                };
                TreeControl.prototype._expandChildren = function (htmlId, ignoreFreeze) {
                    var $item = $("#" + htmlId);
                    this.preloadChildrenIfNecessary(htmlId);
                    if (!this._freezeExpansion || ignoreFreeze) {
                        if ($item.length > 0) {
                            $item.children(".ui-modeltree-children").show();
                            // ensure that expand button is updated
                            $item.children(".ui-modeltree-container").children(".ui-modeltree-expandNode").addClass("expanded");
                        }
                        this._expandVisibilityChildren(htmlId);
                    }
                };
                TreeControl.prototype.expandChildren = function (htmlId) {
                    this._expandChildren(htmlId, false);
                };
                TreeControl.prototype._expandVisibilityChildren = function (htmlId) {
                    var $item = $("#visibility" + (this._separator + htmlId));
                    if ($item.length > 0) {
                        var $visibilityChildren = $item.children(".ui-modeltree-visibility-children");
                        $visibilityChildren.addClass("visible");
                        $visibilityChildren.show();
                    }
                };
                TreeControl.prototype.collapseChildren = function (htmlId) {
                    this._collapseVisibilityChildren(htmlId);
                    var $item = $("#" + htmlId);
                    if ($item.length > 0)
                        $item.children(".ui-modeltree-children").hide();
                };
                TreeControl.prototype._collapseVisibilityChildren = function (htmlId) {
                    var $item = $("#visibility" + this._separator + htmlId);
                    if ($item.length > 0)
                        $item.children(".ui-modeltree-visibility-children").hide();
                };
                TreeControl.prototype._buildNode = function (name, htmlId, itemType, hasChildren, selected, mixed) {
                    if (selected === void 0) { selected = false; }
                    if (mixed === void 0) { mixed = false; }
                    var childItem = document.createElement("li");
                    childItem.classList.add("ui-modeltree-item");
                    if (selected) {
                        childItem.classList.add("selected");
                    }
                    if (mixed) {
                        childItem.classList.add("mixed");
                    }
                    childItem.id = htmlId;
                    var itemNode = document.createElement("div");
                    itemNode.classList.add("ui-modeltree-container");
                    itemNode.style.whiteSpace = "nowrap";
                    var expandNode = document.createElement("div");
                    expandNode.classList.add("ui-modeltree-expandNode");
                    if (!hasChildren)
                        expandNode.style.visibility = "hidden";
                    itemNode.appendChild(expandNode);
                    var iconNode = document.createElement("div");
                    iconNode.classList.add("ui-modeltree-icon");
                    iconNode.classList.add(itemType);
                    itemNode.appendChild(iconNode);
                    var labelNode = document.createElement("div");
                    labelNode.classList.add("ui-modeltree-label");
                    labelNode.innerHTML = name;
                    labelNode.title = name;
                    itemNode.appendChild(labelNode);
                    var mixedSelection = document.createElement("div");
                    mixedSelection.classList.add("ui-mixedselection-icon");
                    itemNode.appendChild(mixedSelection);
                    childItem.appendChild(itemNode);
                    return childItem;
                };
                TreeControl.prototype.childrenAreLoaded = function (htmlId) {
                    return this._childrenLoaded.has(htmlId);
                };
                TreeControl.prototype.preloadChildrenIfNecessary = function (htmlId) {
                    if (htmlId !== null && !this._childrenLoaded.has(htmlId)) {
                        this._triggerCallback("loadChildren", htmlId);
                        this._childrenLoaded.add(htmlId);
                    }
                };
                TreeControl.prototype._processExpandClick = function (event) {
                    var $target = jQuery(event.target);
                    var $listItem = $target.parents(".ui-modeltree-item");
                    var htmlId = $listItem.get(0).id;
                    if ($target.hasClass("expanded")) {
                        this._collapseListItem(htmlId);
                    }
                    else {
                        this._expandListItem(htmlId);
                    }
                };
                /** @hidden */
                TreeControl.prototype._collapseListItem = function (htmlId) {
                    this.collapseChildren(htmlId);
                    var $target = $("#" + htmlId).find(".ui-modeltree-expandNode").first();
                    $target.removeClass("expanded");
                    this._triggerCallback("collapse", htmlId);
                };
                /** @hidden */
                TreeControl.prototype._expandListItem = function (htmlId) {
                    // if children are not loaded, we need to request the nodes for it
                    this.expandChildren(htmlId);
                    var $target = $("#" + htmlId).find(".ui-modeltree-expandNode").first();
                    $target.addClass("expanded");
                    this._triggerCallback("expand", htmlId);
                };
                TreeControl.prototype.selectItem = function (htmlId, triggerEvent) {
                    if (triggerEvent === void 0) { triggerEvent = true; }
                    this._doSelection(htmlId, triggerEvent);
                };
                TreeControl.prototype._getListItem = function (htmlId) {
                    var $listItem = $(this._listRoot).find("#" + htmlId);
                    if ($listItem.length > 0) {
                        return $listItem;
                    }
                    return null;
                };
                TreeControl.prototype._updateNonSelectionHighlight = function ($listItem) {
                    if (this._$lastNonSelectionItem !== undefined) {
                        this._$lastNonSelectionItem.removeClass("selected");
                    }
                    $listItem.addClass("selected");
                    this._$lastNonSelectionItem = $listItem;
                };
                TreeControl.prototype._doUnfreezeSelection = function (selectionIds) {
                    for (var _i = 0, selectionIds_1 = selectionIds; _i < selectionIds_1.length; _i++) {
                        var id = selectionIds_1[_i];
                        var parentId = this._viewer.model.getNodeParent(id);
                        var $listItem = this._getListItem("part" + Ui.ViewTree.separator + id);
                        if ($listItem !== null && !$listItem.hasClass("selected")) {
                            $listItem.addClass("selected");
                            this._selectedPartItems.push($listItem);
                        }
                        else if ($listItem === null) {
                            this._futureHighlightIds.add(id);
                        }
                        if (parentId !== null) {
                            var layerPartId = Ui.LayersTree.getLayerPartId(parentId);
                            if (layerPartId !== null) {
                                var $parentListItem = this._getListItem(layerPartId);
                                if ($parentListItem !== null && !$parentListItem.hasClass("selected")) {
                                    $parentListItem.addClass("selected");
                                    this._selectedPartItems.push($parentListItem);
                                }
                                else if ($parentListItem === null) {
                                    this._futureHighlightIds.add(parentId);
                                }
                            }
                            var $typesListParentItem = this._getListItem(Ui.TypesTree.getComponentPartId(parentId));
                            if ($typesListParentItem !== null) {
                                if (!$typesListParentItem.hasClass("selected")) {
                                    $typesListParentItem.addClass("selected");
                                    this._selectedPartItems.push($typesListParentItem);
                                }
                            }
                        }
                        var $typesListItem = this._getListItem(Ui.TypesTree.getComponentPartId(id));
                        if ($typesListItem !== null) {
                            if (!$typesListItem.hasClass("selected")) {
                                $typesListItem.addClass("selected");
                                this._selectedPartItems.push($typesListItem);
                            }
                        }
                    }
                };
                /** @hidden */
                TreeControl.prototype._doSelection = function (htmlId, triggerEvent) {
                    var _this = this;
                    if (triggerEvent === void 0) { triggerEvent = true; }
                    if (htmlId !== null) {
                        var idParts = htmlId.split(this._separator);
                        var isPart = idParts[0] === "part";
                        var isLayerPart = idParts[0] === "layerpart";
                        var isTypePart = idParts[0] === "typespart";
                        var $listItem = $("#" + htmlId);
                        var contains = false;
                        if (isPart || isLayerPart || isTypePart) {
                            $listItem.addClass("selected");
                            // we will keep track of selection items in an array to update the highlighting for multiple items
                            for (var _i = 0, _a = this._selectedPartItems; _i < _a.length; _i++) {
                                var $item = _a[_i];
                                var item = $item.get(0);
                                if (item !== undefined) {
                                    if (htmlId === item.id) {
                                        contains = true;
                                        break;
                                    }
                                }
                            }
                            if (!contains) {
                                //only add the item to the selected items if it is not already included
                                this._selectedPartItems.push($listItem);
                            }
                        }
                        else if (htmlId.lastIndexOf("sheet", 0) === 0) {
                            // nothing to do
                        }
                        else {
                            // keeps track of the item if it's not of type 'part'.
                            if (htmlId.lastIndexOf("container", 0) === 0) {
                                return;
                            }
                            else if (idParts[0] === Ui.LayersTree.layerPartContainerPrefix) {
                                return;
                            }
                            else {
                                this._updateNonSelectionHighlight($listItem);
                            }
                        }
                        if (triggerEvent) {
                            this._lastItemId = htmlId;
                            var toggleKeyActive = typeof key !== "undefined" && (key.ctrl || key.command);
                            var repeatSelection = contains && this._selectedPartItems.length === 1;
                            var mode = toggleKeyActive || repeatSelection ? Communicator.SelectionMode.Toggle : Communicator.SelectionMode.Set;
                            this._triggerCallback("selectItem", htmlId, mode);
                        }
                        /* This function gets called twice when a label is selected. Once when a label is selected,
                         * and again after the selection callback is triggered. If a label is clicked, we do not want
                         * to scroll the item into view.
                         */
                        if ((this._lastItemId !== htmlId) && !this._freezeExpansion && !triggerEvent) {
                            this._scrollToItem($listItem);
                        }
                    }
                    this._lastItemId = htmlId;
                    this._selectionLabelHighlightTimer.set(30, function () {
                        var selectionIds = _this._viewer.selectionManager.getResults().map(function (item) { return item.getNodeId(); });
                        _this._updateTreeSelectionHighlight(selectionIds);
                    });
                };
                TreeControl.prototype._scrollToItem = function ($listItem) {
                    var _this = this;
                    this._scrollTimer.set(10, function () {
                        var offset = $listItem.offset();
                        var containerHeight = $("#modelTreeContainer").innerHeight();
                        if (offset !== undefined && containerHeight !== undefined) {
                            var offsetTop = offset.top;
                            var hiddenTop = offsetTop < 6;
                            var hiddenBottom = offsetTop > containerHeight;
                            // only scroll to the element if it is not currently visible in the model browser
                            if (hiddenTop || hiddenBottom) {
                                _this._scrollTimer.clear();
                                if (_this._treeScroll) {
                                    _this._treeScroll.refresh();
                                    _this._treeScroll.scrollToElement($listItem.get(0), Communicator.DefaultTransitionDuration, true, true);
                                }
                            }
                        }
                    });
                };
                TreeControl.prototype._parseTaggedId = function (htmlId) {
                    var nodeId = this._parseNodeId(htmlId);
                    if (nodeId !== null) {
                        return new TaggedId(nodeId);
                    }
                    var guid = this._parseGuid(htmlId);
                    if (guid !== null) {
                        return new TaggedId(guid);
                    }
                    return null;
                };
                // Note that measurements and markup views have guid identifers.
                // In the case that we are asked to parse an html id for such an element we cannot deduce a node identifier for the item.
                // In that case the _parseGuid function should be used to deduce the id.
                TreeControl.prototype._parseNodeId = function (htmlId) {
                    var idComponents = htmlId.split(this._separator);
                    if (idComponents.length < 2 || idComponents[0] === "measurement" || idComponents[0] === "markupview") {
                        return null;
                    }
                    var idPart = idComponents[idComponents.length - 1];
                    if (idPart !== undefined) {
                        var nodeId = parseInt(idPart, 10);
                        if (!isNaN(nodeId)) {
                            return nodeId;
                        }
                    }
                    return null;
                };
                TreeControl.prototype._parseGuid = function (htmlId) {
                    var hyphenatedGuidLen = 36;
                    var idPart = htmlId.split(this._separator).pop();
                    if (idPart !== undefined && idPart.length === hyphenatedGuidLen) {
                        return idPart;
                    }
                    return null;
                };
                TreeControl.prototype._parseMeasurementId = function (htmlId) {
                    return htmlId.split(this._separator).pop();
                };
                TreeControl.prototype._parseVisibilityLayerName = function (htmlId) {
                    var idParts = htmlId.split("" + Ui.ViewTree.visibilityPrefix + Ui.ViewTree.separator);
                    if (idParts.length !== 2) {
                        return null;
                    }
                    return Ui.LayersTree.getLayerName(idParts[1]);
                };
                TreeControl.prototype._parseVisibilityLayerNodeId = function (htmlId) {
                    var idParts = htmlId.split("" + Ui.ViewTree.visibilityPrefix + Ui.ViewTree.separator);
                    if (idParts.length !== 2) {
                        return null;
                    }
                    return Ui.LayersTree.getPartId(idParts[1]);
                };
                TreeControl.prototype._updateLayerTreeSelectionHighlight = function () {
                    var _this = this;
                    for (var _i = 0, _a = this._selectedLayers; _i < _a.length; _i++) {
                        var layerName = _a[_i];
                        $("#" + Ui.LayersTree.getLayerId(layerName)).removeClass("selected");
                    }
                    this._mixedItemsLayer.forEach(function (layerId) {
                        var layerName = _this._viewer.model.getLayerName(layerId);
                        if (layerName !== null) {
                            $("#" + Ui.LayersTree.getLayerId(layerName)).addClass("mixed");
                        }
                    });
                    this._selectedLayers = this._viewer.selectionManager.getSelectedLayers();
                    for (var _b = 0, _c = this._selectedLayers; _b < _c.length; _b++) {
                        var layerName = _c[_b];
                        $("#" + Ui.LayersTree.getLayerId(layerName)).addClass("selected");
                        $("#" + Ui.LayersTree.getLayerId(layerName)).removeClass("mixed");
                    }
                };
                TreeControl.prototype._addMixedTypeClass = function (nodeId) {
                    var type = this._viewer.model.getNodeGenericType(nodeId);
                    if (type !== null && !this._mixedTypes.has(type)) {
                        $("#" + Ui.TypesTree.getGenericTypeId(type)).addClass("mixed");
                        this._mixedTypes.add(type);
                        return true;
                    }
                    return false;
                };
                TreeControl.prototype._updateTypesTreeSelectionHighlight = function () {
                    for (var _i = 0, _a = this._selectedTypes; _i < _a.length; _i++) {
                        var type = _a[_i];
                        $("#" + Ui.TypesTree.getGenericTypeId(type)).removeClass("selected");
                    }
                    for (var _b = 0, _c = this._futureMixedTypesIds; _b < _c.length; _b++) {
                        var nodeId = _c[_b];
                        if (!this._addMixedTypeClass(nodeId)) {
                            var parentId = this._viewer.model.getNodeParent(nodeId);
                            if (parentId !== null) {
                                this._addMixedTypeClass(parentId);
                            }
                        }
                    }
                    this._selectedTypes = this._viewer.selectionManager.getSelectedTypes();
                    for (var _d = 0, _e = this._selectedTypes; _d < _e.length; _d++) {
                        var type = _e[_d];
                        var $type = $("#" + Ui.TypesTree.getGenericTypeId(type));
                        $type.addClass("selected");
                        $type.removeClass("mixed");
                    }
                };
                // update the tree highlighting for selection items (not cadviews, measurements, etc)
                TreeControl.prototype._updateTreeSelectionHighlight = function (selectionIds) {
                    var _this = this;
                    // update the future highlight list to reflect the current selection set
                    this._futureHighlightIds.forEach(function (key) {
                        if (selectionIds.indexOf(key) >= 0) {
                            _this._futureHighlightIds.delete(key);
                        }
                    });
                    for (var _i = 0, _a = this._selectedItemsParentIds; _i < _a.length; _i++) {
                        var nodeId = _a[_i];
                        $("#part" + Ui.ViewTree.separator + nodeId).removeClass("mixed");
                    }
                    this._selectedItemsParentIds.length = 0;
                    this._futureMixedIds.clear();
                    this._mixedItemsLayer.forEach(function (layerId) {
                        var layerName = _this._viewer.model.getLayerName(layerId);
                        if (layerName !== null) {
                            $("#" + Ui.LayersTree.getLayerId(layerName)).removeClass("mixed");
                        }
                    });
                    this._mixedItemsLayer.clear();
                    this._mixedTypes.forEach(function (type) {
                        $("#" + Ui.TypesTree.getGenericTypeId(type)).removeClass("mixed");
                    });
                    this._mixedTypes.clear();
                    this._futureMixedTypesIds = [];
                    // remove items that are no longer selected.
                    Communicator.Internal.filterInPlace(this._selectedPartItems, function ($item) {
                        var element = $item.get(0);
                        if (element !== undefined) {
                            var nodeId = _this._parseNodeId(element.id);
                            if (nodeId === null) {
                                return false;
                            }
                            else if (selectionIds.indexOf(nodeId) < 0) {
                                $("#part" + Ui.ViewTree.separator + nodeId).removeClass("selected");
                                $("#typespart" + Ui.ViewTree.separator + nodeId).removeClass("selected");
                                var layerPartNodeId = Ui.LayersTree.getLayerPartId(nodeId);
                                if (layerPartNodeId)
                                    $("#" + layerPartNodeId).removeClass("selected");
                                return false;
                            }
                        }
                        return true;
                    });
                    // add all parents of selected items for the "mixed" icon
                    for (var _b = 0, selectionIds_2 = selectionIds; _b < selectionIds_2.length; _b++) {
                        var nodeId = selectionIds_2[_b];
                        this._updateParentIdList(nodeId);
                        this._updateMixedLayers(nodeId);
                        this._updateMixedTypes(nodeId);
                    }
                    for (var _c = 0, _d = this._selectedItemsParentIds; _c < _d.length; _c++) {
                        var nodeId = _d[_c];
                        var $listItem = this._getListItem("part" + Ui.ViewTree.separator + nodeId);
                        if ($listItem !== null && !$listItem.hasClass("mixed")) {
                            $listItem.addClass("mixed");
                        }
                        else {
                            this._futureMixedIds.add(nodeId);
                        }
                    }
                    this._updateLayerTreeSelectionHighlight();
                    this._updateTypesTreeSelectionHighlight();
                };
                // add mixed class to parents of selected items
                TreeControl.prototype._updateParentIdList = function (childId) {
                    var model = this._viewer.model;
                    if (model.isNodeLoaded(childId)) {
                        var parentId = model.getNodeParent(childId);
                        while (parentId !== null && this._selectedItemsParentIds.indexOf(parentId) === -1) {
                            this._selectedItemsParentIds.push(parentId);
                            parentId = model.getNodeParent(parentId);
                        }
                    }
                };
                // add mixed class to layers with selected items
                TreeControl.prototype._updateMixedLayers = function (nodeId) {
                    var layerId = this._viewer.model.getNodeLayerId(nodeId);
                    if (layerId !== null) {
                        this._mixedItemsLayer.add(layerId);
                    }
                };
                // add mixed class to types with seelcted items
                TreeControl.prototype._updateMixedTypes = function (nodeId) {
                    this._futureMixedTypesIds.push(nodeId);
                };
                TreeControl.prototype._processLabelContext = function (event, position) {
                    var $target = jQuery(event.target);
                    var $listItem = $target.closest(".ui-modeltree-item");
                    if (!position) {
                        position = new Communicator.Point2(event.clientX, event.clientY);
                    }
                    var id = $listItem.get(0).id;
                    this._triggerCallback("context", id, position);
                };
                TreeControl.prototype._processLabelClick = function (event) {
                    var $target = jQuery(event.target);
                    var $listItem = $target.closest(".ui-modeltree-item");
                    this._doSelection($listItem.get(0).id, true);
                };
                TreeControl.prototype.appendTopLevelElement = function (name, htmlId, itemType, hasChildren, loadChildren, markChildrenLoaded) {
                    if (loadChildren === void 0) { loadChildren = true; }
                    if (markChildrenLoaded === void 0) { markChildrenLoaded = false; }
                    if (name === null) {
                        name = "unnamed";
                    }
                    var childItem = this._buildNode(name, htmlId, itemType, hasChildren);
                    if (htmlId.substring(0, 4) === "part" && this._listRoot.firstChild) {
                        this._listRoot.insertBefore(childItem, this._listRoot.firstChild);
                    }
                    else {
                        this._listRoot.appendChild(childItem);
                    }
                    var childVisibilityItem = this._buildPartVisibilityNode(htmlId, itemType);
                    if (childVisibilityItem !== null) {
                        this._partVisibilityRoot.appendChild(childVisibilityItem);
                    }
                    if (loadChildren) {
                        this.preloadChildrenIfNecessary(htmlId);
                    }
                    if (markChildrenLoaded) {
                        this._childrenLoaded.add(htmlId);
                    }
                    return childItem;
                };
                TreeControl.prototype.insertNodeAfter = function (name, htmlId, itemType, element, hasChildren) {
                    return this._insertNodeAfter(name, htmlId, itemType, element, hasChildren);
                };
                /** @hidden */
                TreeControl.prototype._insertNodeAfter = function (name, htmlId, itemType, element, hasChildren) {
                    if (name === null) {
                        name = "unnamed";
                    }
                    if (element.parentNode === null) {
                        throw new Communicator.CommunicatorError("element.parentNode is null");
                    }
                    var childItem = this._buildNode(name, htmlId, itemType, hasChildren);
                    if (element.nextSibling)
                        element.parentNode.insertBefore(childItem, element.nextSibling);
                    else
                        element.parentNode.appendChild(childItem);
                    this.preloadChildrenIfNecessary(htmlId);
                    return childItem;
                };
                TreeControl.prototype.clear = function () {
                    while (this._listRoot.firstChild) {
                        this._listRoot.removeChild(this._listRoot.firstChild);
                    }
                    while (this._partVisibilityRoot.firstChild) {
                        this._partVisibilityRoot.removeChild(this._partVisibilityRoot.firstChild);
                    }
                    this._childrenLoaded.clear();
                    this._loadedNodes.clear();
                };
                // expand to first node with multiple children
                TreeControl.prototype.expandInitialNodes = function (htmlId) {
                    var currentHtmlId = htmlId;
                    var childNodes = [];
                    while (childNodes.length <= 1) {
                        childNodes = this._getChildItemsFromModelTreeItem($("#" + currentHtmlId));
                        // If there are no children, do not try to expand them
                        if (childNodes.length === 0) {
                            break;
                        }
                        this._expandChildren(currentHtmlId, true);
                        currentHtmlId = childNodes[0].id;
                        this.preloadChildrenIfNecessary(currentHtmlId);
                    }
                };
                /** @hidden */
                TreeControl.prototype._processVisibilityClick = function (htmlId) {
                    return __awaiter(this, void 0, void 0, function () {
                        var prefix;
                        return __generator(this, function (_a) {
                            prefix = htmlId.split(this._separator)[1];
                            switch (prefix) {
                                case "part":
                                    return [2 /*return*/, this._processPartVisibilityClick(htmlId)];
                                case "measurement":
                                    return [2 /*return*/, this._processMeasurementVisibilityClick(htmlId)];
                                case "layer":
                                    return [2 /*return*/, this._processLayerVisibilityClick(htmlId)];
                                case "layerpart":
                                    return [2 /*return*/, this._processLayerPartVisibilityClick(htmlId)];
                                case "types":
                                    return [2 /*return*/, this._processTypesVisibilityClick(htmlId)];
                                case "typespart":
                                    return [2 /*return*/, this._processTypesPartVisibilityClick(htmlId)];
                            }
                            return [2 /*return*/];
                        });
                    });
                };
                TreeControl.prototype._processPartVisibilityClick = function (htmlId) {
                    return __awaiter(this, void 0, void 0, function () {
                        var nodeId;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    nodeId = this._parseNodeId(htmlId);
                                    if (!(nodeId !== null)) return [3 /*break*/, 2];
                                    return [4 /*yield*/, this._processPartVisibility(nodeId)];
                                case 1:
                                    _a.sent();
                                    _a.label = 2;
                                case 2: return [2 /*return*/];
                            }
                        });
                    });
                };
                TreeControl.prototype._processPartVisibility = function (nodeId) {
                    return __awaiter(this, void 0, void 0, function () {
                        var model, visibility, isIfcSpace;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    model = this._viewer.model;
                                    visibility = model.getNodeVisibility(nodeId);
                                    isIfcSpace = model._hasEffectiveGenericType(nodeId, Communicator.StaticGenericType.IfcSpace);
                                    return [4 /*yield*/, model.setNodesVisibility([nodeId], !visibility, isIfcSpace ? false : null)];
                                case 1:
                                    _a.sent();
                                    return [2 /*return*/];
                            }
                        });
                    });
                };
                //update the visibility state of measurement items in the scene
                TreeControl.prototype._processMeasurementVisibilityClick = function (htmlId) {
                    var parsedGuid = this._parseMeasurementId(htmlId);
                    var measureItems = this._viewer.measureManager.getAllMeasurements();
                    if (parsedGuid === "measurementitems") {
                        // root folder, toggle all measurement items visibility
                        var visibility = true;
                        for (var _i = 0, measureItems_1 = measureItems; _i < measureItems_1.length; _i++) {
                            var measureItem = measureItems_1[_i];
                            if (measureItem.getVisibility()) {
                                visibility = false;
                                break;
                            }
                        }
                        for (var _a = 0, measureItems_2 = measureItems; _a < measureItems_2.length; _a++) {
                            var measureItem = measureItems_2[_a];
                            measureItem.setVisibility(visibility);
                        }
                    }
                    else {
                        for (var _b = 0, measureItems_3 = measureItems; _b < measureItems_3.length; _b++) {
                            var measureItem = measureItems_3[_b];
                            if (parsedGuid === measureItem._getId()) {
                                var visibility = measureItem.getVisibility();
                                measureItem.setVisibility(!visibility);
                            }
                        }
                    }
                };
                TreeControl.prototype._processTypesVisibilityClick = function (htmlId) {
                    return __awaiter(this, void 0, void 0, function () {
                        var type;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    type = htmlId.split(this._separator).pop();
                                    if (type === undefined) {
                                        return [2 /*return*/];
                                    }
                                    return [4 /*yield*/, this._processTypesVisibility(type)];
                                case 1:
                                    _a.sent();
                                    return [2 /*return*/];
                            }
                        });
                    });
                };
                TreeControl.prototype._processTypesVisibility = function (type) {
                    return __awaiter(this, void 0, void 0, function () {
                        var model, visibility, nodeIds, visibilityIds_1;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    model = this._viewer.model;
                                    visibility = false;
                                    nodeIds = model.getNodesByGenericType(type);
                                    if (!(nodeIds !== null)) return [3 /*break*/, 2];
                                    visibilityIds_1 = [];
                                    nodeIds.forEach(function (nodeId) {
                                        visibility = visibility || model.getNodeVisibility(nodeId);
                                        visibilityIds_1.push(nodeId);
                                    });
                                    return [4 /*yield*/, model.setNodesVisibility(visibilityIds_1, !visibility, type === Communicator.StaticGenericType.IfcSpace ? false : null)];
                                case 1:
                                    _a.sent();
                                    this.updateTypesVisibilityIcons();
                                    _a.label = 2;
                                case 2: return [2 /*return*/];
                            }
                        });
                    });
                };
                TreeControl.prototype._processTypesPartVisibilityClick = function (htmlId) {
                    return __awaiter(this, void 0, void 0, function () {
                        var nodeId;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    nodeId = this._parseNodeId(htmlId);
                                    if (nodeId === null) {
                                        return [2 /*return*/];
                                    }
                                    return [4 /*yield*/, this._processTypesPartVisibility(nodeId)];
                                case 1:
                                    _a.sent();
                                    return [2 /*return*/];
                            }
                        });
                    });
                };
                TreeControl.prototype._processTypesPartVisibility = function (nodeId) {
                    return __awaiter(this, void 0, void 0, function () {
                        var model, visibility, isIfcSpace;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    model = this._viewer.model;
                                    return [4 /*yield*/, model.getNodeVisibility(nodeId)];
                                case 1:
                                    visibility = _a.sent();
                                    isIfcSpace = model._hasEffectiveGenericType(nodeId, Communicator.StaticGenericType.IfcSpace);
                                    return [4 /*yield*/, model.setNodesVisibility([nodeId], !visibility, isIfcSpace ? false : null)];
                                case 2:
                                    _a.sent();
                                    return [2 /*return*/];
                            }
                        });
                    });
                };
                TreeControl.prototype.updateTypesVisibilityIcons = function () {
                    var model = this._viewer.model;
                    var typeIds = model.getGenericTypeIdMap();
                    typeIds.forEach(function (nodeIds, type) {
                        var partHidden = false;
                        var partShown = false;
                        nodeIds.forEach(function (nodeId) {
                            var elem = $("#visibility" + Ui.ViewTree.separator + Ui.TypesTree.getComponentPartId(nodeId));
                            elem.removeClass("partHidden");
                            if (model.getNodeVisibility(nodeId)) {
                                partShown = true;
                            }
                            else {
                                partHidden = true;
                                elem.addClass("partHidden");
                            }
                        });
                        var elem = $("#visibility" + Ui.ViewTree.separator + Ui.TypesTree.getGenericTypeId(type));
                        elem.removeClass(["partHidden", "partialHidden"]);
                        if (partHidden && partShown) {
                            elem.addClass("partialHidden");
                        }
                        else if (partHidden) {
                            elem.addClass("partHidden");
                        }
                    });
                };
                // handles a visibility click for a top level folder in the layers tree
                TreeControl.prototype._processLayerVisibilityClick = function (htmlId) {
                    return __awaiter(this, void 0, void 0, function () {
                        var layerName, visibility, nodeIds, i;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    layerName = this._parseVisibilityLayerName(htmlId);
                                    if (!layerName) {
                                        return [2 /*return*/];
                                    }
                                    visibility = false;
                                    nodeIds = this._viewer.model.getNodesFromLayerName(layerName, true);
                                    if (!(nodeIds !== null)) return [3 /*break*/, 2];
                                    for (i = 0; i < nodeIds.length; ++i) {
                                        visibility = visibility || this._viewer.model.getNodeVisibility(nodeIds[i]);
                                        if (visibility) {
                                            break;
                                        }
                                    }
                                    Communicator._filterActiveSheetNodeIds(this._viewer, nodeIds);
                                    if (!(nodeIds.length > 0)) return [3 /*break*/, 2];
                                    return [4 /*yield*/, this._viewer.model.setNodesVisibility(nodeIds, !visibility, null)];
                                case 1:
                                    _a.sent();
                                    _a.label = 2;
                                case 2: return [2 /*return*/];
                            }
                        });
                    });
                };
                // handles a visibility click for a child of a top level folder in the layers tree
                TreeControl.prototype._processLayerPartVisibilityClick = function (htmlId) {
                    return __awaiter(this, void 0, void 0, function () {
                        var nodeId, visibility, nodeIds;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    nodeId = this._parseVisibilityLayerNodeId(htmlId);
                                    if (!(nodeId !== null)) return [3 /*break*/, 2];
                                    visibility = this._viewer.model.getNodeVisibility(nodeId);
                                    nodeIds = [nodeId];
                                    Communicator._filterActiveSheetNodeIds(this._viewer, nodeIds);
                                    if (!(nodeIds.length > 0)) return [3 /*break*/, 2];
                                    return [4 /*yield*/, this._viewer.model.setNodesVisibility(nodeIds, !visibility, null)];
                                case 1:
                                    _a.sent();
                                    _a.label = 2;
                                case 2: return [2 /*return*/];
                            }
                        });
                    });
                };
                TreeControl.prototype.updateLayersVisibilityIcons = function () {
                    var _this = this;
                    var layerNames = this._viewer.model.getUniqueLayerNames();
                    layerNames.forEach(function (layerName) {
                        var nodeIds = _this._viewer.model.getNodesFromLayerName(layerName, true);
                        if (nodeIds !== null) {
                            var partHidden = false;
                            var partShown = false;
                            for (var i = 0; i < nodeIds.length; ++i) {
                                var id = nodeIds[i];
                                // For non drawing models, the parent id is used (This was mainly for BIM models)
                                if (!_this._viewer.model.isDrawing()) {
                                    id = _this._viewer.model.getNodeParent(nodeIds[i]);
                                }
                                if (id !== null) {
                                    var elem_1 = $("#visibility" + Ui.ViewTree.separator + Ui.LayersTree.getLayerPartId(id));
                                    elem_1.removeClass("partHidden");
                                    if (_this._viewer.model.getNodeVisibility(nodeIds[i])) {
                                        partShown = true;
                                    }
                                    else {
                                        partHidden = true;
                                        elem_1.addClass("partHidden");
                                    }
                                }
                            }
                            var elem = $("#visibility" + Ui.ViewTree.separator + Ui.LayersTree.getLayerId(layerName));
                            elem.removeClass(["partHidden", "partialHidden"]);
                            if (partHidden && partShown) {
                                elem.addClass("partialHidden");
                            }
                            else if (partHidden) {
                                elem.addClass("partHidden");
                            }
                        }
                    });
                };
                // update the visibility icons in the measurement folder
                TreeControl.prototype.updateMeasurementVisibilityIcons = function () {
                    var measureItems = this._viewer.measureManager.getAllMeasurements();
                    var hiddenCount = 0;
                    for (var _i = 0, measureItems_4 = measureItems; _i < measureItems_4.length; _i++) {
                        var measureItem = measureItems_4[_i];
                        var visibility = measureItem.getVisibility();
                        var elem = $("#visibility" + Ui.ViewTree.separator + "measurement" + Ui.ViewTree.separator + measureItem._getId());
                        if (!visibility) {
                            hiddenCount++;
                            elem.addClass("partHidden");
                        }
                        else {
                            elem.removeClass("partHidden");
                        }
                    }
                    var measurementFolder = $("#visibility" + Ui.ViewTree.separator + "measurementitems");
                    if (hiddenCount === measureItems.length) {
                        measurementFolder.removeClass("partialHidden");
                        measurementFolder.addClass("partHidden");
                    }
                    else if (hiddenCount > 0 && hiddenCount < measureItems.length) {
                        measurementFolder.removeClass("partHidden");
                        measurementFolder.addClass("partialHidden");
                    }
                    else {
                        measurementFolder.removeClass("partialHidden");
                        measurementFolder.removeClass("partHidden");
                    }
                    this._viewer.markupManager.updateLater();
                };
                TreeControl.prototype._init = function () {
                    var _this = this;
                    var container = document.getElementById(this._elementId);
                    if (container === null) {
                        throw new Communicator.CommunicatorError("container is null");
                    }
                    this._partVisibilityRoot.classList.add("ui-visibility-toggle");
                    container.appendChild(this._partVisibilityRoot);
                    this._listRoot.classList.add("ui-modeltree");
                    this._listRoot.classList.add("ui-modeltree-item");
                    container.appendChild(this._listRoot);
                    $(container).on("click", ".ui-modeltree-label", function (event) {
                        _this._processLabelClick(event);
                    });
                    $(container).on("click", ".ui-modeltree-expandNode", function (event) {
                        _this._processExpandClick(event);
                    });
                    $(container).on("click", ".ui-modeltree-partVisibility-icon", function (event) {
                        var $target = jQuery(event.target);
                        var $listItem = $target.closest(".ui-modeltree-item");
                        var htmlId = $listItem[0].id;
                        _this._processVisibilityClick(htmlId);
                    });
                    $(container).on("click", "#contextMenuButton", function (event) {
                        _this._processLabelContext(event);
                    });
                    $(container).on("mouseup", ".ui-modeltree-label, .ui-modeltree-icon", function (event) {
                        if (event.which === 3)
                            _this._processLabelContext(event);
                    });
                    $(container).on("touchstart", function (event) {
                        _this._touchTimer.set(1000, function () {
                            var e = event.originalEvent;
                            var x = e.touches[0].pageX;
                            var y = e.touches[0].pageY;
                            var position = new Communicator.Point2(x, y);
                            _this._processLabelContext(event, position);
                        });
                    });
                    $(container).on("touchmove", function (_event) {
                        _this._touchTimer.clear();
                    });
                    $(container).on("touchend", function (_event) {
                        _this._touchTimer.clear();
                    });
                    $(container).on("contextmenu", ".ui-modeltree-label", function (event) {
                        event.preventDefault();
                    });
                };
                TreeControl.prototype._getChildItemsFromModelTreeItem = function ($modeltreeItem) {
                    var $childItems = $modeltreeItem.children(".ui-modeltree-children").children(".ui-modeltree-item");
                    return $.makeArray($childItems);
                };
                return TreeControl;
            }());
            Control.TreeControl = TreeControl;
        })(Control = Ui.Control || (Ui.Control = {}));
    })(Ui = Communicator.Ui || (Communicator.Ui = {}));
})(Communicator || (Communicator = {}));
/// <reference path="../../js/hoops_web_viewer.d.ts"/>
var Communicator;
(function (Communicator) {
    var Ui;
    (function (Ui) {
        function isIfcType(s) {
            return s.substr(0, 3) === "IFC";
        }
        var TypesTree = /** @class */ (function (_super) {
            __extends(TypesTree, _super);
            function TypesTree(viewer, elementId, iScroll) {
                var _this = _super.call(this, viewer, elementId, iScroll) || this;
                _this._initEvents();
                return _this;
            }
            TypesTree.prototype._initEvents = function () {
                var _this = this;
                var onNewModel = function () {
                    return _this._onNewModel();
                };
                this._viewer.setCallbacks({
                    modelStructureReady: onNewModel,
                    modelLoaded: onNewModel,
                    selectionArray: function (events) {
                        _this._tree.updateSelection(events);
                    },
                    visibilityChanged: function () {
                        _this._tree.updateTypesVisibilityIcons();
                    }
                });
                this._tree.registerCallback("selectItem", function (htmlId, selectionMode) {
                    _this._onTreeSelectItem(htmlId, selectionMode);
                });
            };
            TypesTree.prototype._onTreeSelectItem = function (htmlId, selectionMode) {
                if (selectionMode === void 0) { selectionMode = Communicator.SelectionMode.Set; }
                var thisElement = document.getElementById(htmlId);
                if (thisElement === null) {
                    return;
                }
                var idParts = this._splitHtmlId(htmlId);
                var partId = idParts[1];
                if (isIfcType(partId)) {
                    this._selectIfcComponent(partId, selectionMode);
                }
                else {
                    this._viewer.selectPart(parseInt(partId, 10), selectionMode);
                }
            };
            TypesTree.prototype._selectIfcComponent = function (genericType, selectionMode) {
                this._viewer.selectionManager.selectType(genericType, selectionMode);
            };
            TypesTree.prototype._onNewModel = function () {
                return __awaiter(this, void 0, void 0, function () {
                    var _this = this;
                    var model;
                    return __generator(this, function (_a) {
                        model = this._viewer.model;
                        this._tree.clear();
                        this._ifcNodesMap = model.getGenericTypeIdMap();
                        this._ifcNodesMap.forEach(function (nodeIds, genericType) {
                            var parentHtmlId = TypesTree.getGenericTypeId(genericType);
                            var itemType = "assembly";
                            var hasChildren = true;
                            _this._tree.appendTopLevelElement(genericType, parentHtmlId, itemType, hasChildren);
                            itemType = "part";
                            hasChildren = false;
                            nodeIds.forEach(function (nodeId) {
                                var childHtmlId = TypesTree.getComponentPartId(nodeId);
                                var name = model.getNodeName(nodeId);
                                _this._tree.addChild(name, childHtmlId, parentHtmlId, itemType, hasChildren, Ui.Desktop.Tree.Types);
                            });
                        });
                        if (this._ifcNodesMap.size === 0) {
                            this.hideTab();
                        }
                        else {
                            this.showTab();
                        }
                        return [2 /*return*/];
                    });
                });
            };
            TypesTree.getComponentPartId = function (id) {
                return "typespart" + Ui.ViewTree.separator + id;
            };
            TypesTree.getGenericTypeId = function (genericType) {
                return "types" + Ui.ViewTree.separator + genericType;
            };
            return TypesTree;
        }(Ui.ViewTree));
        Ui.TypesTree = TypesTree;
    })(Ui = Communicator.Ui || (Communicator.Ui = {}));
})(Communicator || (Communicator = {}));
