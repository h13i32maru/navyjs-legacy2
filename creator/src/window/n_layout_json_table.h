#ifndef N_LAYOUT_JSON_TABLE_H
#define N_LAYOUT_JSON_TABLE_H

#include <QDialog>
#include <QModelIndex>

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

private:
    Ui::NLayoutJSONTable *ui;
    QModelIndex mCurrentShowIndex;
    QList<NJson> mWidgetDefines;

private slots:
    void addRow(bool atLast = false);
    void showCellWidget(const QModelIndex &modelIndex);
    void hideCurrentCellWidget();
};

#endif // N_LAYOUT_JSON_TABLE_H
