#ifndef N_PAGE_DIALOG_H
#define N_PAGE_DIALOG_H

#include <QDialog>
#include "util/n_json.h"

namespace Ui {
class NPageDialog;
}

class NPageDialog : public QDialog
{
    Q_OBJECT

public:
    enum TYPE {TYPE_UPDATE, TYPE_CREATE};
    explicit NPageDialog(TYPE type, NJson &configPage, QWidget *parent = 0);
    void setPageId(const QString &pageId);
    ~NPageDialog();

private:
    Ui::NPageDialog *ui;
    TYPE mType;
    NJson &mConfigPage;
    int mPageIndex;

private slots:
    void checkClassFile(const QString &path);
    void checkLayoutFile(const QString &path);
    void updatePage();
};

#endif // N_PAGE_DIALOG_H
