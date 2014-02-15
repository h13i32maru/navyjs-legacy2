#include "n_table_widget.h"

#include <QDropEvent>
#include <QDebug>
NTableWidget::NTableWidget(QWidget *parent) : QTableWidget(parent)
{
}

void NTableWidget::mouseReleaseEvent(QMouseEvent * event) {
    QTableWidgetItem *item = this->itemAt(event->x(), event->y());
    if (item == NULL) {
        emit this->outOfCellClicked();
    }

    QTableWidget::mouseReleaseEvent(event);
}
