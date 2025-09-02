"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { FileText, Download, Eye } from "lucide-react"

interface HealthRecord {
  id: string
  type: string
  title: string
  date: string
  doctor?: string
  fileUrl?: string
}

interface HealthRecordsProps {
  records: HealthRecord[]
  onView?: (record: HealthRecord) => void
  onDownload?: (record: HealthRecord) => void
}

export function HealthRecords({ records, onView, onDownload }: HealthRecordsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Health Records
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {records.map((record) => (
            <div key={record.id} className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold">{record.title}</h3>
                  <Badge variant="outline">{record.type}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">{record.date}</p>
                {record.doctor && (
                  <p className="text-sm text-muted-foreground">Dr. {record.doctor}</p>
                )}
              </div>
              <div className="flex gap-2">
                {onView && (
                  <Button variant="outline" size="sm" onClick={() => onView(record)}>
                    <Eye className="h-4 w-4" />
                  </Button>
                )}
                {onDownload && record.fileUrl && (
                  <Button variant="outline" size="sm" onClick={() => onDownload(record)}>
                    <Download className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
