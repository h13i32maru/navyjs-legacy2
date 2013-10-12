#ifndef N_CONFIG_PAGE_WIDGET_H
#define N_CONFIG_PAGE_WIDGET_H

#include "n_file_widget.h"
#include "util/n_json.h"

#include <QTreeWidgetItem>
#include <QWidget>

namespace Ui {
class NConfigPageWidget;
}

class NConfigPageWidget : public NFileWidget
{
    Q_OBJECT

public:
    enum PAGE_COL {PAGE_COL_ID, PAGE_COL_CLASS, PAGE_COL_CLASS_FILE, PAGE_COL_LAYOUT, PAGE_COL_BGCOLOR};
    explicit NConfigPageWidget(const QDir &projectDir, const QString &filePath, QWidget *parent = 0);
    ~NConfigPageWidget();

protected:
    virtual bool innerSave();

private:
    Ui::NConfigPageWidget *ui;
    NJson mConfigPage;

private slots:
    void newPage();
    void removePage();
    void contextMenu(QPoint point);
    void showRawData();
    void syncJsonToTree();
    void showPageDialog(const QModelIndex &/*index*/);
};

#endif // N_CONFIG_PAGE_WIDGET_H
