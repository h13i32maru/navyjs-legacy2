#ifndef N_LAYOUT_JSON_TABLE_H
#define N_LAYOUT_JSON_TABLE_H

#include <QDialog>
#include <QModelIndex>
#include <QStandardItem>
#include <QTableWidgetItem>

#include <util/n_json.h>

namespace Ui {
class NLayoutJSONTable;
}

class NLayoutJSONTable : public QDialog
{
    Q_OBJECT

public:
    explicit NLayoutJSONTable(QWidget *parent = 0);
    ~NLayoutJSONTable();
    void addColumn(NJson widgetDefine);
    void setJsonArray(const NJson &jsonArray);
    NJson getJsonArray() const;

public slots:
    virtual void accept();

private:
    Ui::NLayoutJSONTable *ui;
    QHash<QTableWidgetItem *, QWidget *> mCellToWidget;
    int mCurrentRow;
    int mCurrentColumn;
    QList<NJson> mWidgetDefines;

private slots:
    void addRow(bool atLast = false);
    void removeRow();
    void showCellWidget(int row, int column);
    void hideCurrentCellWidget();
    void hideCellWidget(QTableWidgetItem *item);
    void hideAllCellWidget();
    void clickedOutOfCell();
};

#endif // N_LAYOUT_JSON_TABLE_H
