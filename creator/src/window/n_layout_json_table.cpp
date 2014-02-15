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

//    QStandardItemModel *model = new QStandardItemModel(0, 0);
//    ui->tableView->setModel(model);

    connect(this->ui->okButton, SIGNAL(clicked()), this, SLOT(accept()));
    connect(this->ui->cancelButton, SIGNAL(clicked()), this, SLOT(close()));
    connect(this->ui->addButton, SIGNAL(clicked()), this, SLOT(addRow()));

//    connect(this->ui->tableView, SIGNAL(clicked(QModelIndex)), this, SLOT(showCellWidget(QModelIndex)));
    connect(this->ui->tableView, SIGNAL(cellClicked(int,int)), this, SLOT(showCellWidget(int,int)));
}

void NLayoutJSONTable::addColumn(NJson widgetDefine) {
    QString label = widgetDefine.getStr("label");
//    QStandardItemModel *model = (QStandardItemModel *)ui->tableView->model();
//    int count = ui->tableView->horizontalHeader()->count();
//    model->setHorizontalHeaderItem(count, new QStandardItem(label));
    int count = ui->tableView->horizontalHeader()->count();
    ui->tableView->setColumnCount(count + 1);
    ui->tableView->setHorizontalHeaderItem(count, new QTableWidgetItem(label));

    mWidgetDefines.append(widgetDefine);
}

NJson NLayoutJSONTable::getJsonArray() const {
    NJson jsonArray;
    jsonArray.parse(QString("[]"));

//    QStandardItemModel *model = (QStandardItemModel *)ui->tableView->model();
//    for (int row = 0; row < model->rowCount(); row++) {
    for (int row = 0; row < ui->tableView->rowCount(); row++) {
       for(int column = 0; column < mWidgetDefines.length(); column++) {
//           QStandardItem *item = model->item(row, column);
           QTableWidgetItem * item = ui->tableView->item(row, column);
           QWidget *widget = mCellToWidget[item];
           ViewPlugin::syncWidgetToView(widget, jsonArray, QString::number(row));
           /*
           QString value = item->text();
           QString type = mWidgetDefines[column].getStr("type");
           QString key = QString::number(row) + "." + mWidgetDefines[column].getStr("key");
           ViewPlugin::decodeValue(jsonArray, value, type, key);
           */
       }
    }

    return jsonArray;
}

void NLayoutJSONTable::setJsonArray(const NJson &jsonArray) {

//    QStandardItemModel *model = (QStandardItemModel *)ui->tableView->model();
    for (int row = 0; row < jsonArray.length(); row++) {
        addRow(true);
        for(int column = 0; column < mWidgetDefines.length(); column++) {
//           QStandardItem *item = model->item(row, column);

            QTableWidgetItem *item = ui->tableView->item(row, column);
            QWidget *widget = mCellToWidget[item];
            ViewPlugin::syncViewToWidget(jsonArray, widget, QString::number(row));
            QString value = ViewPlugin::widgetToString(widget);
            item->setText(value);

           /*
           QString type = mWidgetDefines[column].getStr("type");
           QString key = QString::number(row) + "." + mWidgetDefines[column].getStr("key");
           QString value = ViewPlugin::encodeValue(jsonArray, type, key);

           QStandardItem *item = model->item(row, column);
           item->setText(value);
           */
        }
    }
}

void NLayoutJSONTable::addRow(bool atLast) {
//    QStandardItemModel *model = (QStandardItemModel *)ui->tableView->model();

//    int rowCount = model->rowCount();
    int rowCount = ui->tableView->rowCount();
    int rowIndex;
//    int currentSelectedRow = ui->tableView->currentIndex().row();
    int currentSelectedRow = ui->tableView->currentRow();

    if (atLast || currentSelectedRow == -1) {
        rowIndex = rowCount;
    } else {
       rowIndex = currentSelectedRow + 1;
    }

//    model->insertRow(rowIndex);
    ui->tableView->insertRow(rowIndex);
//    for (int columnIndex = 0; columnIndex < model->columnCount(); columnIndex++) {
    for (int columnIndex = 0; columnIndex < mWidgetDefines.length(); columnIndex++) {
//        QStandardItem *item = new QStandardItem("");
        QTableWidgetItem *item = new QTableWidgetItem("");
        QWidget *widget = ViewPlugin::createWidget(mWidgetDefines[columnIndex]);
        mCellToWidget[item] = widget;

//        model->setItem(rowIndex, columnIndex, item);
        ui->tableView->setItem(rowIndex, columnIndex, item);
    }
}

//void NLayoutJSONTable::showCellWidget(const QModelIndex &modelIndex) {
void NLayoutJSONTable::showCellWidget(int row, int column) {
    hideCurrentCellWidget();

//    QStandardItemModel *model = (QStandardItemModel *)ui->tableView->model();
//    QStandardItem *item = model->item(modelIndex.row(), modelIndex.column());
    QTableWidgetItem *item = ui->tableView->item(row, column);
    QWidget *widget = mCellToWidget[item];

//    ui->tableView->setIndexWidget(modelIndex, widget);
    ui->tableView->setCellWidget(row, column, widget);

//    qDebug() << "before set index widget";
//    qDebug() << "widget = " << widget;
//    widget->setAutoFillBackground(true);
//    widget->show();
//    ui->tableView->setIndexWidget(modelIndex, widget);
//    qDebug() << "after set index widget";

//    mCurrentShowIndex = modelIndex;
    mCurrentRow = row;
    mCurrentColumn = column;
    /*
    hideCurrentCellWidget();

    QWidget *widget = ViewPlugin::createWidget(mWidgetDefines[modelIndex.column()]);
    ui->tableView->setIndexWidget(modelIndex, widget);

    QStandardItemModel *model = (QStandardItemModel *)ui->tableView->model();
    QStandardItem *item = model->item(modelIndex.row(), modelIndex.column());
    ViewPlugin::decodeValue(widget, item->text());

    mCurrentShowIndex = modelIndex;
    */
}

void NLayoutJSONTable::hideCurrentCellWidget() {
//    if (!mCurrentShowIndex.isValid()) {
//        return;
//    }

    if (mCurrentRow == -1 || mCurrentColumn == -1) {
        return;
    }

//    QStandardItemModel *model = (QStandardItemModel *)ui->tableView->model();
//    QStandardItem *item = model->item(mCurrentShowIndex.row(), mCurrentShowIndex.column());
    QTableWidgetItem *item = ui->tableView->item(mCurrentRow, mCurrentColumn);

    hideCellWidget(item);
}

void NLayoutJSONTable::hideAllCellWidget() {
//    foreach (QStandardItem *item, mCellToWidget.keys()) {
    foreach (QTableWidgetItem *item, mCellToWidget.keys()) {
        hideCellWidget(item);
    }
}

//void NLayoutJSONTable::hideCellWidget(QStandardItem* item) {
void NLayoutJSONTable::hideCellWidget(QTableWidgetItem* item) {
    QWidget *widget = mCellToWidget[item];

    QString value = ViewPlugin::widgetToString(widget);
    item->setText(value);

    // setIndexWidgetをすると以前のwidgetは破棄されてしまうのでcopyして新しいwidgetを作っておく
    QWidget *newWidget = ViewPlugin::copyWidget(widget);
    mCellToWidget[item] = newWidget;
//    ui->tableView->setIndexWidget(item->index(), NULL);
    ui->tableView->setCellWidget(item->row(), item->column(), NULL);
}

NLayoutJSONTable::~NLayoutJSONTable()
{
    delete ui;
}
