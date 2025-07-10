public class MintHistoryTrackingTriggerLogDeleter implements Queueable {
    Id logRecordId;
    public MintHistoryTrackingTriggerLogDeleter(Id logRecordId) {
        this.logRecordId = logRecordId;
    }
    public void execute(QueueableContext context) {
        try {
            delete new Mint_History_Tracking_Configuration__c(Id = logRecordId);
        } catch (Exception ex) {
            System.debug('Failed to delete log record: ' + ex.getMessage());
        }
    }
}