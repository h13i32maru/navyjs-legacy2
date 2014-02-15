#include "n_layout_json_table.h"
#include "ui_n_layout_json_table.h"

#include <QLabel>
#include <QLineEdit>
#include <QModelIndex>
#include <QStandardItemModel>

#include <QDebug>

#include <plugin/view_plugin.h>

NLayoutJSONTable::NLayoutJSONTable(QWidget *parent) : QDialog(parent), ui(new Ui::NLayoutJSONTable)
{
    mCurrentRow = mCurrentColumn = -1;

    ui->setupUi(this);

    connect(this->ui->okButton, SIGNAL(clicked()), this, SLOT(accept()));
    connect(this->ui->cancelButton, SIGNAL(clicked()), this, SLOT(close()));

    connect(this->ui->addButton, SIGNAL(clicked()), this, SLOT(addRow()));
    connect(this->ui->remoteButton, SIGNAL(clicked()), this, SLOT(removeRow()));

    connect(this->ui->tableWidget, SIGNAL(cellClicked(int,int)), this, SLOT(showCellWidget(int,int)));
}

void NLayoutJSONTable::addColumn(NJson widgetDefine) {
    QString label = widgetDefine.getStr("label");
    int count = ui->tableWidget->horizontalHeader()->count();
    ui->tableWidget->setColumnCount(count + 1);
    ui->tableWidget->setHorizontalHeaderItem(count, new QTableWidgetItem(label));

    mWidgetDefines.append(widgetDefine);
}

NJson NLayoutJSONTable::getJsonArray() const {
    NJson jsonArray;
    jsonArray.parse(QString("[]"));

    for (int row = 0; row < ui->tableWidget->rowCount(); row++) {
       for(int column = 0; column < mWidgetDefines.length(); column++) {
           QTableWidgetItem * item = ui->tableWidget->item(row, column);
           QWidget *widget = mCellToWidget[item];
           ViewPlugin::syncWidgetToView(widget, jsonArray, QString::number(row));
       }
    }

    return jsonArray;
}

void NLayoutJSONTable::setJsonArray(const NJson &jsonArray) {

    for (int row = 0; row < jsonArray.length(); row++) {
        addRow(true);
        for(int column = 0; column < mWidgetDefines.length(); column++) {
            QTableWidgetItem *item = ui->tableWidget->item(row, column);
            QWidget *widget = mCellToWidget[item];
            ViewPlugin::syncViewToWidget(jsonArray, widget, QString::number(row));
            QString value = ViewPlugin::widgetToString(widget);
            item->setText(value);
        }
    }
}

void NLayoutJSONTable::addRow(bool atLast) {
    int rowCount = ui->tableWidget->rowCount();
    int rowIndex;
    int currentSelectedRow = ui->tableWidget->currentRow();

    if (atLast || currentSelectedRow == -1) {
        rowIndex = rowCount;
    } else {
       rowIndex = currentSelectedRow + 1;
    }

    ui->tableWidget->insertRow(rowIndex);
    for (int columnIndex = 0; columnIndex < mWidgetDefines.length(); columnIndex++) {
        QTableWidgetItem *item = new QTableWidgetItem("");
        QWidget *widget = ViewPlugin::createWidget(mWidgetDefines[columnIndex]);
        mCellToWidget[item] = widget;
        ui->tableWidget->setItem(rowIndex, columnIndex, item);
    }
}

void NLayoutJSONTable::removeRow() {
    QList<QTableWidgetItem *> items = ui->tableWidget->selectedItems();
    if (items.length() != 0) {
        ui->tableWidget->removeRow(items[0]->row());
        ui->tableWidget->clearSelection();
    }
}

void NLayoutJSONTable::showCellWidget(int row, int column) {
    hideCurrentCellWidget();

    QTableWidgetItem *item = ui->tableWidget->item(row, column);
    QWidget *widget = mCellToWidget[item];

    ui->tableWidget->setCellWidget(row, column, widget);

    mCurrentRow = row;
    mCurrentColumn = column;
}

void NLayoutJSONTable::hideCurrentCellWidget() {
    if (mCurrentRow == -1 || mCurrentColumn == -1) {
        return;
    }

    QTableWidgetItem *item = ui->tableWidget->item(mCurrentRow, mCurrentColumn);
    hideCellWidget(item);
}

void NLayoutJSONTable::hideAllCellWidget() {
    foreach (QTableWidgetItem *item, mCellToWidget.keys()) {
        hideCellWidget(item);
    }
}

void NLayoutJSONTable::hideCellWidget(QTableWidgetItem* item) {
    QWidget *widget = mCellToWidget[item];

    QString value = ViewPlugin::widgetToString(widget);
    item->setText(value);

    // setIndexWidgetをすると以前のwidgetは破棄されてしまうのでcopyして新しいwidgetを作っておく
    QWidget *newWidget = ViewPlugin::copyWidget(widget);
    mCellToWidget[item] = newWidget;
    ui->tableWidget->setCellWidget(item->row(), item->column(), NULL);
}

NLayoutJSONTable::~NLayoutJSONTable()
{
    delete ui;
}
