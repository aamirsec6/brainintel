"use strict";
/**
 * Shared TypeScript types and interfaces
 * Single source of truth for all type definitions across services
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MergeStatus = exports.EventStatus = exports.IdentifierType = void 0;
// ============================================================================
// ENUMS
// ============================================================================
var IdentifierType;
(function (IdentifierType) {
    IdentifierType["PHONE"] = "phone";
    IdentifierType["EMAIL"] = "email";
    IdentifierType["DEVICE"] = "device";
    IdentifierType["COOKIE"] = "cookie";
    IdentifierType["LOYALTY_ID"] = "loyalty_id";
    IdentifierType["INVOICE_ID"] = "invoice_id";
})(IdentifierType || (exports.IdentifierType = IdentifierType = {}));
var EventStatus;
(function (EventStatus) {
    EventStatus["ACCEPTED"] = "accepted";
    EventStatus["QUARANTINED"] = "quarantined";
    EventStatus["PROCESSED"] = "processed";
})(EventStatus || (exports.EventStatus = EventStatus = {}));
var MergeStatus;
(function (MergeStatus) {
    MergeStatus["AUTO"] = "auto";
    MergeStatus["MANUAL"] = "manual";
    MergeStatus["PENDING_REVIEW"] = "pending_review";
    MergeStatus["ROLLED_BACK"] = "rolled_back";
})(MergeStatus || (exports.MergeStatus = MergeStatus = {}));
//# sourceMappingURL=index.js.map